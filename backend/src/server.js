import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { authRouter } from './routes/auth.js'
import { queryRouter } from './routes/query.js'
import { requireAuth } from './auth.js'

const app = express()
const port = Number(process.env.PORT || 3001)

const corsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(
  cors({
    origin: corsOrigins.length ? corsOrigins : true,
    credentials: true,
  })
)
app.use(express.json({ limit: '1mb' }))

app.get('/healthz', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

app.use('/api/auth', authRouter)
app.use('/api/db/query', requireAuth, queryRouter)

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
