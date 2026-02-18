import 'dotenv/config'
import crypto from 'node:crypto'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { authRouter } from './routes/auth.js'
import { functionsRouter } from './routes/functions.js'
import { queryRouter } from './routes/query.js'
import { requireAuth } from './auth.js'

const app = express()
const port = Number(process.env.PORT || 3001)
const isProd = process.env.NODE_ENV === 'production'

const corsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

if (isProd && corsOrigins.length === 0) {
  throw new Error('CORS_ORIGIN is required when NODE_ENV=production.')
}

app.disable('x-powered-by')
app.use(
  helmet({
    // API-only server: CSP/CORP defaults can break cross-origin API usage in dev.
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  })
)

app.use(
  cors({
    origin: corsOrigins.length ? corsOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
  })
)
app.use(express.json({ limit: '1mb' }))

app.use((req, res, next) => {
  const requestId = crypto.randomUUID()
  const startedAt = Date.now()
  req.requestId = requestId
  res.setHeader('x-request-id', requestId)

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        level: 'info',
        requestId,
        method: req.method,
        path: req.originalUrl || req.url,
        statusCode: res.statusCode,
        durationMs,
      })
    )
  })

  next()
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
})

const queryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
})

const functionsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
})

app.get('/healthz', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

app.use('/api/auth', authLimiter, authRouter)
app.use('/api/db/query', queryLimiter, requireAuth, queryRouter)
app.use('/api/functions', functionsLimiter, requireAuth, functionsRouter)

app.use((error, _req, res, _next) => {
  const requestId = _req.requestId || ''
  // eslint-disable-next-line no-console
  console.error(
    JSON.stringify({
      level: 'error',
      requestId,
      message: error?.message || 'Unexpected backend error.',
      stack: isProd ? undefined : error?.stack,
    })
  )

  res.status(500).json({
    error: error?.message || 'Unexpected backend error.',
    requestId,
  })
})

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[backend] listening on http://localhost:${port}`)
})
