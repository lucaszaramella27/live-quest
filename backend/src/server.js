import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { authRouter } from './routes/auth.js'
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

app.get('/healthz', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

app.use('/api/auth', authLimiter, authRouter)
app.use('/api/db/query', queryLimiter, requireAuth, queryRouter)

app.post('/api/functions/:functionName', requireAuth, (req, res) => {
  const { functionName } = req.params

  res.status(501).json({
    error: `Function "${functionName}" is not implemented in backend yet.`,
  })
})

app.use((error, _req, res, _next) => {
  res.status(500).json({
    error: error?.message || 'Unexpected backend error.',
  })
})

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[backend] listening on http://localhost:${port}`)
})
