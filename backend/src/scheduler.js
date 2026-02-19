import cron from 'node-cron'
import { query, withTransaction } from './db.js'

const MS_IN_HOUR = 60 * 60 * 1000
const TWITCH_TOKEN_SAFETY_WINDOW_SECONDS = 60

let cachedTwitchAppToken = null
let cachedTwitchAppTokenExpiresAt = 0
let warnedMissingTwitchConfig = false

function toNonNegativeInt(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.floor(numeric))
}

function parseDateOrNull(value) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function getXPForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1))
}

function getLevelFromXP(xp) {
  let level = 1
  let totalXP = 0

  while (totalXP + getXPForLevel(level) <= xp) {
    totalXP += getXPForLevel(level)
    level += 1
  }

  return level
}

function parseBooleanEnv(rawValue, fallback = false) {
  if (rawValue === undefined || rawValue === null || rawValue === '') return fallback
  return String(rawValue).trim().toLowerCase() !== 'false'
}

function parseIntegerEnv(rawValue, fallback, minValue = 1, maxValue = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(rawValue)
  if (!Number.isFinite(parsed)) return fallback
  const normalized = Math.floor(parsed)
  return Math.min(Math.max(normalized, minValue), maxValue)
}

function getSchedulerConfig() {
  const isProd = process.env.NODE_ENV === 'production'

  return {
    enabled: parseBooleanEnv(process.env.SCHEDULER_ENABLED, isProd),
    runOnStart: parseBooleanEnv(process.env.SCHEDULER_RUN_ON_START, false),
    timezone: (process.env.SCHEDULER_TIMEZONE || 'UTC').trim() || 'UTC',
    weeklyResetCron: (process.env.CRON_WEEKLY_RESET || '0 0 * * 0').trim(),
    monthlyResetCron: (process.env.CRON_MONTHLY_RESET || '0 0 1 * *').trim(),
    twitchSweepEnabled: parseBooleanEnv(process.env.TWITCH_AUTOSWEEP_ENABLED, false),
    twitchSweepCron: (process.env.CRON_TWITCH_SWEEP || '*/30 * * * *').trim(),
    twitchSweepMaxUsers: parseIntegerEnv(process.env.TWITCH_SWEEP_MAX_USERS_PER_RUN, 200, 1, 2000),
  }
}

function getTwitchClientId() {
  return (process.env.TWITCH_CLIENT_ID || '').trim()
}

function getTwitchClientSecret() {
  return (process.env.TWITCH_CLIENT_SECRET || '').trim()
}

async function fetchTwitchAppAccessToken() {
  const clientId = getTwitchClientId()
  const clientSecret = getTwitchClientSecret()
  if (!clientId || !clientSecret) {
    throw new Error('twitch_not_configured')
  }

  const nowSeconds = Math.floor(Date.now() / 1000)
  if (cachedTwitchAppToken && cachedTwitchAppTokenExpiresAt - TWITCH_TOKEN_SAFETY_WINDOW_SECONDS > nowSeconds) {
    return cachedTwitchAppToken
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
  })

  const response = await fetch(`https://id.twitch.tv/oauth2/token?${params.toString()}`, {
    method: 'POST',
  })
  const body = await response.json().catch(() => null)
  if (!response.ok || !body?.access_token) {
    throw new Error('twitch_app_token_error')
  }

  cachedTwitchAppToken = String(body.access_token)
  cachedTwitchAppTokenExpiresAt = nowSeconds + Math.max(0, Number(body.expires_in || 0))
  return cachedTwitchAppToken
}

async function fetchTwitchStreamByUserId(twitchUserId) {
  const clientId = getTwitchClientId()
  const appToken = await fetchTwitchAppAccessToken()
  const params = new URLSearchParams({ user_id: String(twitchUserId) })
  const response = await fetch(`https://api.twitch.tv/helix/streams?${params.toString()}`, {
    headers: {
      'Client-Id': clientId,
      Authorization: `Bearer ${appToken}`,
    },
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error('twitch_stream_error')
  }
  return Array.isArray(body?.data) ? body.data[0] || null : null
}

async function ensureProgressRowForUser(client, userId) {
  const existing = await client.query(
    `
      SELECT user_id, xp, level, coins, achievements, unlocked_titles, active_title, weekly_xp, monthly_xp, user_name, user_photo_url, is_premium
      FROM public.user_progress
      WHERE user_id = $1
      LIMIT 1
      FOR UPDATE
    `,
    [userId]
  )
  if (existing.rowCount) return existing.rows[0]

  const userQuery = await client.query(
    `
      SELECT id, display_name, photo_url, is_premium
      FROM public.users
      WHERE id = $1
      LIMIT 1
    `,
    [userId]
  )
  const userRow = userQuery.rows[0]
  if (!userRow) {
    throw new Error('user_not_found')
  }

  const inserted = await client.query(
    `
      INSERT INTO public.user_progress (
        user_id,
        xp,
        level,
        coins,
        achievements,
        unlocked_titles,
        active_title,
        weekly_xp,
        monthly_xp,
        user_name,
        user_photo_url,
        is_premium,
        premium_expires_at
      )
      VALUES ($1, 0, 1, 0, '{}', '{novice}', 'novice', 0, 0, $2, $3, $4, NULL)
      RETURNING user_id, xp, level, coins, achievements, unlocked_titles, active_title, weekly_xp, monthly_xp, user_name, user_photo_url, is_premium
    `,
    [userId, userRow.display_name || 'Usuario', userRow.photo_url || '', Boolean(userRow.is_premium)]
  )
  return inserted.rows[0]
}

async function runWeeklyResetJob(logger) {
  const result = await query(
    `
      UPDATE public.user_progress
      SET weekly_xp = 0
      WHERE weekly_xp <> 0
    `
  )
  logger.info(
    JSON.stringify({
      scope: 'scheduler',
      job: 'weekly_reset',
      affectedRows: toNonNegativeInt(result.rowCount),
    })
  )
}

async function runMonthlyResetJob(logger) {
  const result = await query(
    `
      UPDATE public.user_progress
      SET monthly_xp = 0
      WHERE monthly_xp <> 0
    `
  )
  logger.info(
    JSON.stringify({
      scope: 'scheduler',
      job: 'monthly_reset',
      affectedRows: toNonNegativeInt(result.rowCount),
    })
  )
}

async function processTwitchSweepUser(userId, stream, now) {
  const nowIso = now.toISOString()
  const isLive = Boolean(stream && stream.type === 'live')

  return withTransaction(async (client) => {
    const integrationQuery = await client.query(
      `
        SELECT user_id, twitch_user_id, twitch_display_name, twitch_login, auto_xp_on_live, xp_per_hour_live, last_stream_check, total_views
        FROM public.twitch_integrations
        WHERE user_id = $1
        LIMIT 1
        FOR UPDATE
      `,
      [userId]
    )

    if (!integrationQuery.rowCount) {
      return { processed: false, xpAwarded: 0 }
    }

    const integration = integrationQuery.rows[0]
    let xpAwarded = 0

    if (isLive && integration.auto_xp_on_live) {
      const lastCheckin = parseDateOrNull(integration.last_stream_check)
      if (lastCheckin) {
        const elapsedHours = Math.floor(Math.max(0, now.getTime() - lastCheckin.getTime()) / MS_IN_HOUR)
        const cappedHours = Math.min(6, elapsedHours)
        if (cappedHours > 0) {
          const hourlyXP = Math.max(1, toNonNegativeInt(integration.xp_per_hour_live || 50))
          xpAwarded = cappedHours * hourlyXP

          const progress = await ensureProgressRowForUser(client, userId)
          const nextXP = Math.max(0, toNonNegativeInt(progress.xp) + xpAwarded)
          const nextLevel = getLevelFromXP(nextXP)
          const nextWeeklyXP = Math.max(0, toNonNegativeInt(progress.weekly_xp) + xpAwarded)
          const nextMonthlyXP = Math.max(0, toNonNegativeInt(progress.monthly_xp) + xpAwarded)

          await client.query(
            `
              UPDATE public.user_progress
              SET
                xp = $2,
                level = $3,
                weekly_xp = $4,
                monthly_xp = $5,
                updated_at = $6
              WHERE user_id = $1
            `,
            [userId, nextXP, nextLevel, nextWeeklyXP, nextMonthlyXP, nowIso]
          )
        }
      }
    }

    await client.query(
      `
        UPDATE public.twitch_integrations
        SET
          is_live = $2,
          twitch_display_name = COALESCE($3, twitch_display_name),
          twitch_login = COALESCE($4, twitch_login),
          last_stream_check = $5,
          total_views = $6,
          updated_at = $5
        WHERE user_id = $1
      `,
      [
        userId,
        isLive,
        stream ? String(stream.user_name || '') : null,
        stream ? String(stream.user_login || '') : null,
        nowIso,
        stream ? Number(stream.viewer_count || 0) : Number(integration.total_views || 0),
      ]
    )

    return { processed: true, xpAwarded }
  })
}

async function runTwitchSweepJob(config, logger) {
  const clientId = getTwitchClientId()
  const clientSecret = getTwitchClientSecret()
  if (!clientId || !clientSecret) {
    if (!warnedMissingTwitchConfig) {
      warnedMissingTwitchConfig = true
      logger.warn(
        JSON.stringify({
          scope: 'scheduler',
          job: 'twitch_sweep',
          message: 'Skipping Twitch sweep because TWITCH_CLIENT_ID/SECRET are not configured.',
        })
      )
    }
    return
  }

  warnedMissingTwitchConfig = false

  const integrations = await query(
    `
      SELECT user_id, twitch_user_id
      FROM public.twitch_integrations
      WHERE auto_xp_on_live = true
        AND twitch_user_id IS NOT NULL
        AND twitch_user_id <> ''
      ORDER BY user_id ASC
      LIMIT $1
    `,
    [config.twitchSweepMaxUsers]
  )

  const now = new Date()
  let processed = 0
  let totalAwarded = 0
  let failures = 0

  for (const row of integrations.rows) {
    try {
      const stream = await fetchTwitchStreamByUserId(String(row.twitch_user_id))
      const result = await processTwitchSweepUser(String(row.user_id), stream, now)
      if (result.processed) {
        processed += 1
        totalAwarded += toNonNegativeInt(result.xpAwarded)
      }
    } catch (error) {
      failures += 1
      logger.error(
        JSON.stringify({
          scope: 'scheduler',
          job: 'twitch_sweep',
          userId: String(row.user_id || ''),
          error: error?.message || 'twitch_sweep_user_failed',
        })
      )
    }
  }

  logger.info(
    JSON.stringify({
      scope: 'scheduler',
      job: 'twitch_sweep',
      processed,
      totalAwarded,
      failures,
    })
  )
}

export function startScheduler(logger = console) {
  const config = getSchedulerConfig()
  if (!config.enabled) {
    logger.info(JSON.stringify({ scope: 'scheduler', message: 'Scheduler disabled by config.' }))
    return {
      enabled: false,
      stop() {
        return
      },
    }
  }

  const running = new Set()
  const tasks = []

  const runTask = async (name, runner) => {
    if (running.has(name)) {
      logger.warn(JSON.stringify({ scope: 'scheduler', job: name, message: 'Skipping overlapping run.' }))
      return
    }

    running.add(name)
    const startedAt = Date.now()
    try {
      await runner()
      logger.info(
        JSON.stringify({
          scope: 'scheduler',
          job: name,
          status: 'completed',
          durationMs: Date.now() - startedAt,
        })
      )
    } catch (error) {
      logger.error(
        JSON.stringify({
          scope: 'scheduler',
          job: name,
          status: 'failed',
          durationMs: Date.now() - startedAt,
          error: error?.message || 'scheduler_job_failed',
        })
      )
    } finally {
      running.delete(name)
    }
  }

  const registerJob = (name, expression, runner, enabled = true) => {
    if (!enabled) {
      logger.info(JSON.stringify({ scope: 'scheduler', job: name, message: 'Job disabled by config.' }))
      return
    }

    if (!cron.validate(expression)) {
      logger.error(
        JSON.stringify({
          scope: 'scheduler',
          job: name,
          message: `Invalid cron expression: ${expression}`,
        })
      )
      return
    }

    const task = cron.schedule(
      expression,
      () => {
        void runTask(name, runner)
      },
      { timezone: config.timezone }
    )
    tasks.push({ name, task, runner, enabled })
    logger.info(
      JSON.stringify({
        scope: 'scheduler',
        job: name,
        schedule: expression,
        timezone: config.timezone,
      })
    )
  }

  registerJob('weekly_reset', config.weeklyResetCron, () => runWeeklyResetJob(logger))
  registerJob('monthly_reset', config.monthlyResetCron, () => runMonthlyResetJob(logger))
  registerJob(
    'twitch_sweep',
    config.twitchSweepCron,
    () => runTwitchSweepJob(config, logger),
    config.twitchSweepEnabled
  )

  if (config.runOnStart) {
    for (const entry of tasks) {
      if (!entry.enabled) continue
      void runTask(entry.name, entry.runner)
    }
  }

  return {
    enabled: true,
    stop() {
      for (const entry of tasks) {
        entry.task.stop()
        if (typeof entry.task.destroy === 'function') {
          entry.task.destroy()
        }
      }
      logger.info(JSON.stringify({ scope: 'scheduler', message: 'Scheduler stopped.' }))
    },
  }
}
