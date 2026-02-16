import jwt from 'jsonwebtoken'

const jwtSecret = process.env.JWT_SECRET

if (!jwtSecret) {
  throw new Error('JWT_SECRET is required in backend environment.')
}

export function mapUserToAuthPayload(userRow) {
  return {
    id: userRow.id,
    email: userRow.email,
    user_metadata: {
      display_name: userRow.display_name,
      avatar_url: userRow.photo_url || null,
    },
    app_metadata: {
      admin: Boolean(userRow.is_admin),
      role: Boolean(userRow.is_admin) ? 'admin' : 'user',
    },
  }
}

export function createAccessToken(userRow) {
  return jwt.sign(
    {
      sub: userRow.id,
      email: userRow.email,
      is_admin: Boolean(userRow.is_admin),
    },
    jwtSecret,
    { expiresIn: '7d' }
  )
}

export function parseBearerToken(authorizationHeader) {
  if (!authorizationHeader) return null

  const [scheme, token] = authorizationHeader.split(' ')
  if (scheme !== 'Bearer' || !token) return null
  return token.trim()
}

export function verifyAccessToken(token) {
  return jwt.verify(token, jwtSecret)
}

export function requireAuth(req, res, next) {
  try {
    const token = parseBearerToken(req.header('Authorization'))
    if (!token) {
      res.status(401).json({ error: 'Unauthorized: missing bearer token.' })
      return
    }

    const payload = verifyAccessToken(token)
    req.auth = {
      userId: String(payload.sub || ''),
      email: String(payload.email || ''),
      isAdmin: Boolean(payload.is_admin),
    }

    if (!req.auth.userId) {
      res.status(401).json({ error: 'Unauthorized: invalid token subject.' })
      return
    }

    next()
  } catch {
    res.status(401).json({ error: 'Unauthorized: invalid or expired token.' })
  }
}
