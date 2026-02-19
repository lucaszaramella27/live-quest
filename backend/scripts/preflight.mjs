import 'dotenv/config'
import { Pool } from 'pg'
import { buildPreflightReport, formatPreflightReport } from '../src/preflight.js'

const report = buildPreflightReport(process.env)
for (const line of formatPreflightReport(report)) {
  // eslint-disable-next-line no-console
  console.log(line)
}

if (!report.ok) {
  process.exit(1)
}

const skipDbCheck = String(process.env.PREFLIGHT_SKIP_DB || '').trim().toLowerCase() === 'true'
if (skipDbCheck) {
  // eslint-disable-next-line no-console
  console.log('INFO: Skipping DB connectivity check (PREFLIGHT_SKIP_DB=true).')
  process.exit(0)
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

try {
  await pool.query('SELECT 1')
  // eslint-disable-next-line no-console
  console.log('INFO: Database connectivity OK.')
} catch (error) {
  // eslint-disable-next-line no-console
  console.error(`ERROR: Database connectivity failed: ${error?.message || 'unknown_error'}`)
  process.exit(1)
} finally {
  await pool.end()
}
