import { Router } from 'express'
import { z } from 'zod'
import { query } from '../db.js'

const router = Router()

const IDENTIFIER_RE = /^[a-z_][a-z0-9_]*$/i

const allowedTables = new Set([
  'users',
  'user_progress',
  'goals',
  'checklists',
  'calendar_events',
  'streaks',
  'daily_activity',
  'xp_ledger',
  'reward_daily',
  'user_inventories',
  'shop_stock',
  'user_challenges',
  'twitch_integrations',
  'twitch_goals',
])

const jsonColumnsByTable = new Map([
  ['user_challenges', new Set(['challenges'])],
  ['user_inventories', new Set(['active_powerups'])],
])

const querySchema = z.object({
  table: z.string().min(1),
  operation: z.enum(['select', 'insert', 'update', 'delete', 'upsert']),
  select: z.string().optional(),
  filters: z
    .array(
      z.object({
        type: z.enum(['eq', 'gte', 'lte']),
        field: z.string().min(1),
        value: z.any(),
      })
    )
    .optional(),
  order: z
    .object({
      column: z.string().min(1),
      ascending: z.boolean().optional(),
    })
    .optional(),
  limit: z.number().int().positive().max(1000).optional(),
  payload: z.any().optional(),
  options: z
    .object({
      onConflict: z.string().optional(),
    })
    .optional(),
  returning: z.string().optional(),
})

function safeIdentifier(identifier) {
  if (!IDENTIFIER_RE.test(identifier)) {
    throw new Error(`Invalid SQL identifier: ${identifier}`)
  }
  return `"${identifier}"`
}

function safeTable(table) {
  if (!allowedTables.has(table)) {
    throw new Error(`Table not allowed: ${table}`)
  }
  return `${safeIdentifier('public')}.${safeIdentifier(table)}`
}

function buildSelectList(rawSelect) {
  if (!rawSelect || rawSelect.trim() === '' || rawSelect.trim() === '*') return '*'

  const columns = rawSelect
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.replace(/\s+as\s+.*/i, '').trim())

  if (columns.length === 0) return '*'
  return columns.map((column) => safeIdentifier(column)).join(', ')
}

function parseConflictColumns(rawOnConflict) {
  if (!rawOnConflict) return []
  return rawOnConflict
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((column) => {
      if (!IDENTIFIER_RE.test(column)) {
        throw new Error(`Invalid conflict column: ${column}`)
      }
      return column
    })
}

function buildWhere(filters = [], params = [], startIndex = 1) {
  if (!filters.length) {
    return {
      sql: '',
      params,
      nextIndex: startIndex,
    }
  }

  const clauses = []
  let index = startIndex
  const nextParams = [...params]

  for (const filter of filters) {
    const column = safeIdentifier(filter.field)
    const operator = filter.type === 'eq' ? '=' : filter.type === 'gte' ? '>=' : '<='
    clauses.push(`${column} ${operator} $${index}`)
    nextParams.push(filter.value)
    index += 1
  }

  return {
    sql: `WHERE ${clauses.join(' AND ')}`,
    params: nextParams,
    nextIndex: index,
  }
}

function normalizePayload(payload) {
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object') return [payload]
  return []
}

function normalizeJsonColumns(table, payload) {
  const jsonColumns = jsonColumnsByTable.get(table)
  if (!jsonColumns || !payload || typeof payload !== 'object') return payload

  // Convert JS arrays/objects to JSON strings for json/jsonb columns.
  // node-postgres serializes JS arrays as PostgreSQL arrays, which breaks jsonb inserts/updates.
  const next = { ...payload }
  for (const column of jsonColumns) {
    if (!(column in next)) continue
    const value = next[column]
    if (value === null || value === undefined) continue
    if (typeof value === 'string') continue
    next[column] = JSON.stringify(value)
  }
  return next
}

function buildOrder(order) {
  if (!order) return ''
  const column = safeIdentifier(order.column)
  const direction = order.ascending === false ? 'DESC' : 'ASC'
  return `ORDER BY ${column} ${direction}`
}

function buildLimit(limit, baseIndex, params) {
  if (!limit) {
    return { sql: '', params, nextIndex: baseIndex }
  }

  const nextParams = [...params, limit]
  return {
    sql: `LIMIT $${baseIndex}`,
    params: nextParams,
    nextIndex: baseIndex + 1,
  }
}

router.post('/', async (req, res) => {
  const parsed = querySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ data: null, error: { code: 'validation_failed', message: 'Invalid query payload.' } })
    return
  }

  try {
    const {
      table,
      operation,
      select,
      filters = [],
      order,
      limit,
      payload,
      options,
      returning,
    } = parsed.data

    const tableSql = safeTable(table)
    const returningSql = returning ? buildSelectList(returning) : '*'

    if (operation === 'select') {
      const where = buildWhere(filters, [])
      const orderSql = buildOrder(order)
      const limited = buildLimit(limit, where.nextIndex, where.params)
      const selectSql = buildSelectList(select)

      const sql = [
        `SELECT ${selectSql} FROM ${tableSql}`,
        where.sql,
        orderSql,
        limited.sql,
      ]
        .filter(Boolean)
        .join(' ')

      const result = await query(sql, limited.params)
      res.json({ data: result.rows, error: null })
      return
    }

    if (operation === 'insert') {
      const rows = normalizePayload(payload).map((row) => normalizeJsonColumns(table, row))
      if (rows.length === 0) {
        throw new Error('Insert payload is required.')
      }

      const columns = Object.keys(rows[0])
      if (columns.length === 0) {
        throw new Error('Insert payload cannot be empty.')
      }

      const safeColumns = columns.map((column) => safeIdentifier(column))
      const params = []
      const valueGroups = rows.map((row, rowIndex) => {
        const placeholders = columns.map((column, colIndex) => {
          params.push(row[column])
          return `$${rowIndex * columns.length + colIndex + 1}`
        })
        return `(${placeholders.join(', ')})`
      })

      const sql = `
        INSERT INTO ${tableSql} (${safeColumns.join(', ')})
        VALUES ${valueGroups.join(', ')}
        RETURNING ${returningSql}
      `
      const result = await query(sql, params)
      res.json({ data: result.rows, error: null })
      return
    }

    if (operation === 'update') {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new Error('Update payload must be an object.')
      }

      const normalizedPayload = normalizeJsonColumns(table, payload)
      const entries = Object.entries(normalizedPayload)
      if (entries.length === 0) {
        throw new Error('Update payload cannot be empty.')
      }

      const params = []
      const setClause = entries
        .map(([column, value], index) => {
          params.push(value)
          return `${safeIdentifier(column)} = $${index + 1}`
        })
        .join(', ')

      const where = buildWhere(filters, params, params.length + 1)
      const sql = `
        UPDATE ${tableSql}
        SET ${setClause}
        ${where.sql}
        RETURNING ${returningSql}
      `
      const result = await query(sql, where.params)
      res.json({ data: result.rows, error: null })
      return
    }

    if (operation === 'delete') {
      const where = buildWhere(filters, [])
      const sql = `
        DELETE FROM ${tableSql}
        ${where.sql}
        RETURNING ${returningSql}
      `
      const result = await query(sql, where.params)
      res.json({ data: result.rows, error: null })
      return
    }

    if (operation === 'upsert') {
      const rows = normalizePayload(payload).map((row) => normalizeJsonColumns(table, row))
      if (rows.length === 0) {
        throw new Error('Upsert payload is required.')
      }

      const conflictColumns = parseConflictColumns(options?.onConflict)
      if (conflictColumns.length === 0) {
        throw new Error('Upsert requires options.onConflict.')
      }

      const columns = Object.keys(rows[0])
      if (columns.length === 0) {
        throw new Error('Upsert payload cannot be empty.')
      }

      const safeColumns = columns.map((column) => safeIdentifier(column))
      const params = []
      const valueGroups = rows.map((row, rowIndex) => {
        const placeholders = columns.map((column, colIndex) => {
          params.push(row[column])
          return `$${rowIndex * columns.length + colIndex + 1}`
        })
        return `(${placeholders.join(', ')})`
      })

      const updateableColumns = columns.filter((column) => !conflictColumns.includes(column))
      const conflictSql = conflictColumns.map((column) => safeIdentifier(column)).join(', ')
      const updateSql =
        updateableColumns.length > 0
          ? `DO UPDATE SET ${updateableColumns
              .map((column) => `${safeIdentifier(column)} = EXCLUDED.${safeIdentifier(column)}`)
              .join(', ')}`
          : 'DO NOTHING'

      const sql = `
        INSERT INTO ${tableSql} (${safeColumns.join(', ')})
        VALUES ${valueGroups.join(', ')}
        ON CONFLICT (${conflictSql}) ${updateSql}
        RETURNING ${returningSql}
      `
      const result = await query(sql, params)
      res.json({ data: result.rows, error: null })
      return
    }

    res.status(400).json({ data: null, error: { code: 'invalid_operation', message: 'Unsupported operation.' } })
  } catch (error) {
    res.status(400).json({
      data: null,
      error: {
        code: error.code || 'query_error',
        message: error.message || 'Database query failed.',
      },
    })
  }
})

export { router as queryRouter }
