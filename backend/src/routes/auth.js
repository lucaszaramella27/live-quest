import { Router } from 'express'
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { query, withTransaction } from '../db.js'
import { createAccessToken, mapUserToAuthPayload, requireAuth } from '../auth.js'

const router = Router()
const googleClientId = (process.env.GOOGLE_CLIENT_ID || '').trim()

const signUpSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(6).max(128),
  options: z
    .object({
      data: z
        .object({
          display_name: z.string().min(1).max(120).optional(),
        })
        .optional(),
    })
    .optional(),
})

const signInSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
})

const googleSignInSchema = z.object({
  accessToken: z.string().min(1).max(4096),
})

function fallbackDisplayName(email, providedDisplayName) {
  if (providedDisplayName && providedDisplayName.trim()) return providedDisplayName.trim()
  const local = email.split('@')[0] || 'Usuario'
  return local.trim() || 'Usuario'
}

function createHttpError(status, message, code) {
  const error = new Error(message)
  error.status = status
  error.code = code
  return error
}

function normalizeGoogleProfile(rawProfile) {
  const email = typeof rawProfile?.email === 'string' ? rawProfile.email.trim().toLowerCase() : ''
  if (!email) {
    throw createHttpError(400, 'Google account did not return an email.', 'google_email_missing')
  }

  const emailVerified = rawProfile?.email_verified === true || rawProfile?.verified_email === true
  if (!emailVerified) {
    throw createHttpError(400, 'Google account email is not verified.', 'google_email_not_verified')
  }

  const displayNameCandidate = typeof rawProfile?.name === 'string' ? rawProfile.name : ''
  const photoUrlCandidate = typeof rawProfile?.picture === 'string' ? rawProfile.picture.trim() : ''

  return {
    email,
    displayName: fallbackDisplayName(email, displayNameCandidate),
    photoUrl: photoUrlCandidate || null,
  }
}

async function verifyGoogleTokenAudience(accessToken) {
  if (!googleClientId) return

  const tokenInfoResponse = await fetch(
    `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
  )
  const tokenInfo = await tokenInfoResponse.json().catch(() => null)

  if (!tokenInfoResponse.ok || !tokenInfo) {
    throw createHttpError(401, 'Google access token is invalid or expired.', 'google_token_invalid')
  }

  const audience =
    (typeof tokenInfo.audience === 'string' && tokenInfo.audience) ||
    (typeof tokenInfo.issued_to === 'string' && tokenInfo.issued_to) ||
    ''

  if (audience && audience !== googleClientId) {
    throw createHttpError(
      401,
      'Google access token audience does not match backend configuration.',
      'google_token_audience_mismatch'
    )
  }
}

async function fetchGoogleProfile(accessToken) {
  if (!googleClientId) {
    throw createHttpError(500, 'Google OAuth is not configured on backend.', 'google_oauth_not_configured')
  }

  await verifyGoogleTokenAudience(accessToken)

  const googleUserResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  const googleUser = await googleUserResponse.json().catch(() => null)

  if (!googleUserResponse.ok || !googleUser) {
    throw createHttpError(401, 'Google access token is invalid.', 'google_token_invalid')
  }

  return normalizeGoogleProfile(googleUser)
}

async function ensureUserDefaultRows(client, userRow) {
  await client.query(
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
        is_premium
      )
      VALUES ($1, 0, 1, 0, '{}', '{novice}', 'novice', 0, 0, $2, $3, false)
      ON CONFLICT (user_id) DO NOTHING
    `,
    [userRow.id, userRow.display_name, userRow.photo_url || '']
  )

  await client.query(
    `
      INSERT INTO public.streaks (user_id, current_streak, longest_streak, last_checkin)
      VALUES ($1, 0, 0, NULL)
      ON CONFLICT (user_id) DO NOTHING
    `,
    [userRow.id]
  )

  await client.query(
    `
      INSERT INTO public.user_inventories (user_id, purchased_item_ids, active_powerups)
      VALUES ($1, '{}', '[]'::jsonb)
      ON CONFLICT (user_id) DO NOTHING
    `,
    [userRow.id]
  )
}

async function findUserByEmail(email) {
  const result = await query(
    `
      SELECT id, email, password_hash, display_name, photo_url, is_admin, is_premium, created_at
      FROM public.users
      WHERE email = $1
      LIMIT 1
    `,
    [email]
  )

  return result.rows[0] || null
}

async function findUserById(id) {
  const result = await query(
    `
      SELECT id, email, password_hash, display_name, photo_url, is_admin, is_premium, created_at
      FROM public.users
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  )
  return result.rows[0] || null
}

router.post('/signup', async (req, res) => {
  const parsed = signUpSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid signup payload.' })
    return
  }

  const { email, password, options } = parsed.data
  const normalizedEmail = email.trim().toLowerCase()
  const displayName = fallbackDisplayName(normalizedEmail, options?.data?.display_name)

  const existing = await findUserByEmail(normalizedEmail)
  if (existing) {
    res.status(409).json({ error: 'User already exists.' })
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const createdUser = await withTransaction(async (client) => {
    const userInsert = await client.query(
      `
        INSERT INTO public.users (
          email,
          password_hash,
          display_name,
          photo_url,
          is_premium,
          is_admin
        )
        VALUES ($1, $2, $3, NULL, false, false)
        RETURNING id, email, display_name, photo_url, is_admin, is_premium, created_at
      `,
      [normalizedEmail, passwordHash, displayName]
    )

    const user = userInsert.rows[0]
    await ensureUserDefaultRows(client, user)

    return user
  })

  const accessToken = createAccessToken(createdUser)
  res.status(201).json({
    accessToken,
    user: mapUserToAuthPayload(createdUser),
  })
})

router.post('/login', async (req, res) => {
  const parsed = signInSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid login payload.' })
    return
  }

  const normalizedEmail = parsed.data.email.trim().toLowerCase()
  const user = await findUserByEmail(normalizedEmail)

  if (!user) {
    res.status(401).json({ error: 'Invalid credentials.' })
    return
  }

  const validPassword = await bcrypt.compare(parsed.data.password, user.password_hash)
  if (!validPassword) {
    res.status(401).json({ error: 'Invalid credentials.' })
    return
  }

  const accessToken = createAccessToken(user)
  res.json({
    accessToken,
    user: mapUserToAuthPayload(user),
  })
})

router.post('/google', async (req, res) => {
  const parsed = googleSignInSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid Google auth payload.', code: 'validation_failed' })
    return
  }

  try {
    const googleProfile = await fetchGoogleProfile(parsed.data.accessToken)

    const user = await withTransaction(async (client) => {
      const existingUserByEmail = await client.query(
        `
          SELECT id, email, password_hash, display_name, photo_url, is_admin, is_premium, created_at
          FROM public.users
          WHERE email = $1
          LIMIT 1
        `,
        [googleProfile.email]
      )

      let persistedUser = existingUserByEmail.rows[0] || null

      if (!persistedUser) {
        const randomPassword = `${crypto.randomUUID()}-${crypto.randomUUID()}`
        const passwordHash = await bcrypt.hash(randomPassword, 12)

        const insertedUser = await client.query(
          `
            INSERT INTO public.users (
              email,
              password_hash,
              display_name,
              photo_url,
              is_premium,
              is_admin
            )
            VALUES ($1, $2, $3, $4, false, false)
            RETURNING id, email, password_hash, display_name, photo_url, is_admin, is_premium, created_at
          `,
          [googleProfile.email, passwordHash, googleProfile.displayName, googleProfile.photoUrl]
        )

        persistedUser = insertedUser.rows[0]
      } else {
        const nextPhotoUrl = persistedUser.photo_url || googleProfile.photoUrl || null
        const shouldUpdatePhoto = (persistedUser.photo_url || null) !== nextPhotoUrl

        if (shouldUpdatePhoto) {
          const updatedUser = await client.query(
            `
              UPDATE public.users
              SET photo_url = $2
              WHERE id = $1
              RETURNING id, email, password_hash, display_name, photo_url, is_admin, is_premium, created_at
            `,
            [persistedUser.id, nextPhotoUrl]
          )
          persistedUser = updatedUser.rows[0]
        }
      }

      await ensureUserDefaultRows(client, persistedUser)
      return persistedUser
    })

    const accessToken = createAccessToken(user)
    res.json({
      accessToken,
      user: mapUserToAuthPayload(user),
    })
  } catch (error) {
    const status = Number(error?.status) || 500
    res.status(status).json({
      error: error?.message || 'Google authentication failed.',
      code: error?.code || 'google_auth_failed',
    })
  }
})

router.get('/me', requireAuth, async (req, res) => {
  const user = await findUserById(req.auth.userId)
  if (!user) {
    res.status(404).json({ error: 'User not found.' })
    return
  }

  res.json({
    user: mapUserToAuthPayload(user),
  })
})

export { router as authRouter }
