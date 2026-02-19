import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPreflightReport } from '../src/preflight.js'

function createEnv(overrides = {}) {
  return {
    NODE_ENV: 'production',
    DATABASE_URL: 'postgres://user:pass@localhost:5432/livequest',
    JWT_SECRET: '12345678901234567890123456789012',
    CORS_ORIGIN: 'https://app.example.com',
    SCHEDULER_ENABLED: 'true',
    CRON_WEEKLY_RESET: '0 0 * * 0',
    CRON_MONTHLY_RESET: '0 0 1 * *',
    TWITCH_AUTOSWEEP_ENABLED: 'false',
    ...overrides,
  }
}

test('fails when required env vars are missing', () => {
  const report = buildPreflightReport({
    NODE_ENV: 'production',
  })
  assert.equal(report.ok, false)
  assert.ok(report.errors.some((line) => line.includes('DATABASE_URL')))
  assert.ok(report.errors.some((line) => line.includes('JWT_SECRET')))
  assert.ok(report.errors.some((line) => line.includes('CORS_ORIGIN')))
})

test('fails when cron expressions are invalid while scheduler is enabled', () => {
  const report = buildPreflightReport(
    createEnv({
      CRON_WEEKLY_RESET: 'invalid-cron',
    })
  )
  assert.equal(report.ok, false)
  assert.ok(report.errors.some((line) => line.includes('CRON_WEEKLY_RESET')))
})

test('fails when Twitch sweep is enabled without Twitch credentials', () => {
  const report = buildPreflightReport(
    createEnv({
      TWITCH_AUTOSWEEP_ENABLED: 'true',
      TWITCH_CLIENT_ID: '',
      TWITCH_CLIENT_SECRET: '',
    })
  )
  assert.equal(report.ok, false)
  assert.ok(report.errors.some((line) => line.includes('TWITCH_AUTOSWEEP_ENABLED')))
})

test('passes for a valid production-like configuration', () => {
  const report = buildPreflightReport(
    createEnv({
      TWITCH_CLIENT_ID: 'abc',
      TWITCH_CLIENT_SECRET: 'def',
      TWITCH_AUTOSWEEP_ENABLED: 'true',
      CRON_TWITCH_SWEEP: '*/30 * * * *',
      GOOGLE_CLIENT_ID: 'google-client-id',
    })
  )
  assert.equal(report.ok, true)
  assert.equal(report.errors.length, 0)
})
