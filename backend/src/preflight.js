import cron from 'node-cron'

function parseBooleanEnv(rawValue, fallback = false) {
  if (rawValue === undefined || rawValue === null || rawValue === '') return fallback
  return String(rawValue).trim().toLowerCase() !== 'false'
}

function isLikelyPostgresConnectionString(value) {
  if (!value) return false
  const normalized = String(value).trim().toLowerCase()
  return normalized.startsWith('postgres://') || normalized.startsWith('postgresql://')
}

export function buildPreflightReport(env = process.env) {
  const errors = []
  const warnings = []
  const info = []

  const nodeEnv = (env.NODE_ENV || 'development').trim().toLowerCase()
  const isProd = nodeEnv === 'production'

  if (!env.DATABASE_URL) {
    errors.push('Missing DATABASE_URL.')
  } else if (!isLikelyPostgresConnectionString(env.DATABASE_URL)) {
    errors.push('DATABASE_URL must be a postgres connection string.')
  }

  if (!env.JWT_SECRET) {
    errors.push('Missing JWT_SECRET.')
  } else if (String(env.JWT_SECRET).length < 24) {
    warnings.push('JWT_SECRET is short. Prefer 32+ characters.')
  }

  if (isProd && !env.CORS_ORIGIN) {
    errors.push('Missing CORS_ORIGIN for production.')
  }

  const schedulerEnabled = parseBooleanEnv(env.SCHEDULER_ENABLED, isProd)
  if (schedulerEnabled) {
    const weeklyCron = String(env.CRON_WEEKLY_RESET || '0 0 * * 0').trim()
    const monthlyCron = String(env.CRON_MONTHLY_RESET || '0 0 1 * *').trim()
    if (!cron.validate(weeklyCron)) {
      errors.push(`Invalid CRON_WEEKLY_RESET expression: "${weeklyCron}".`)
    }
    if (!cron.validate(monthlyCron)) {
      errors.push(`Invalid CRON_MONTHLY_RESET expression: "${monthlyCron}".`)
    }
  }

  const twitchSweepEnabled = parseBooleanEnv(env.TWITCH_AUTOSWEEP_ENABLED, false)
  const twitchClientId = (env.TWITCH_CLIENT_ID || '').trim()
  const twitchClientSecret = (env.TWITCH_CLIENT_SECRET || '').trim()
  if ((twitchClientId && !twitchClientSecret) || (!twitchClientId && twitchClientSecret)) {
    errors.push('TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET must be configured together.')
  }
  if (twitchSweepEnabled && (!twitchClientId || !twitchClientSecret)) {
    errors.push('TWITCH_AUTOSWEEP_ENABLED=true requires TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET.')
  }
  if (twitchSweepEnabled) {
    const twitchCron = String(env.CRON_TWITCH_SWEEP || '*/30 * * * *').trim()
    if (!cron.validate(twitchCron)) {
      errors.push(`Invalid CRON_TWITCH_SWEEP expression: "${twitchCron}".`)
    }
  }

  const billingCheckout = (env.BILLING_CHECKOUT_URL || '').trim()
  const billingMonthly = (env.BILLING_CHECKOUT_URL_MONTHLY || '').trim()
  const billingYearly = (env.BILLING_CHECKOUT_URL_YEARLY || '').trim()
  if (!billingCheckout && !billingMonthly && !billingYearly && isProd) {
    warnings.push('Billing checkout URLs are not configured. Plans checkout will fail in production.')
  }
  if ((billingMonthly && !billingYearly) || (!billingMonthly && billingYearly)) {
    warnings.push('Only one cycle-specific billing URL is configured. Verify monthly/yearly checkout behavior.')
  }

  const googleClientId = (env.GOOGLE_CLIENT_ID || '').trim()
  if (!googleClientId) {
    warnings.push('GOOGLE_CLIENT_ID is missing. Google login will be unavailable.')
  }

  info.push(`NODE_ENV=${nodeEnv}`)
  info.push(`scheduler_enabled=${schedulerEnabled}`)
  info.push(`twitch_sweep_enabled=${twitchSweepEnabled}`)

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    info,
  }
}

export function formatPreflightReport(report) {
  const lines = []
  for (const line of report.info) lines.push(`INFO: ${line}`)
  for (const line of report.warnings) lines.push(`WARN: ${line}`)
  for (const line of report.errors) lines.push(`ERROR: ${line}`)
  lines.push(report.ok ? 'RESULT: OK' : 'RESULT: FAILED')
  return lines
}
