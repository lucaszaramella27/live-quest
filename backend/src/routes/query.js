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

const ownerColumnByTable = new Map([
  ['users', 'id'],
  ['user_progress', 'user_id'],
  ['goals', 'user_id'],
  ['checklists', 'user_id'],
  ['calendar_events', 'user_id'],
  ['streaks', 'user_id'],
  ['daily_activity', 'user_id'],
  ['xp_ledger', 'user_id'],
  ['reward_daily', 'user_id'],
  ['user_inventories', 'user_id'],
  ['user_challenges', 'user_id'],
  ['twitch_integrations', 'user_id'],
  ['twitch_goals', 'user_id'],
])

const USERS_SAFE_SELECT_COLUMNS = [
  'id',
  'email',
  'display_name',
  'photo_url',
  'is_premium',
  'is_admin',
  'created_at',
  'updated_at',
]
const USERS_ALLOWED_SELECT_COLUMNS = new Set(USERS_SAFE_SELECT_COLUMNS)
const USERS_FORBIDDEN_WRITE_COLUMNS = new Set(['password_hash', 'is_admin'])
const USERS_NON_ADMIN_FORBIDDEN_WRITE_COLUMNS = new Set(['is_premium'])
const USERS_FORBIDDEN_SELECT_COLUMNS = new Set(['password_hash'])

const USER_PROGRESS_NON_ADMIN_FORBIDDEN_WRITE_COLUMNS = new Set(['is_premium', 'premium_expires_at'])

const NON_ADMIN_READ_ONLY_TABLES = new Set([
  'user_progress',
  'daily_activity',
  'xp_ledger',
  'reward_daily',
  'user_inventories',
  'shop_stock',
  'user_challenges',
  'streaks',
  'twitch_integrations',
])

const NON_ADMIN_FORBIDDEN_WRITE_COLUMNS_BY_TABLE = new Map([
  ['goals', new Set(['rewarded_at', 'created_at'])],
  ['checklists', new Set(['rewarded_at', 'created_at'])],
  ['calendar_events', new Set(['rewarded_at', 'created_at'])],
])

const USER_PROGRESS_PUBLIC_COLUMNS = new Set([
  'user_id',
  'user_name',
  'level',
  'xp',
  'user_photo_url',
  'active_title',
  'weekly_xp',
  'monthly_xp',
  'is_premium',
])

const USER_PROGRESS_PUBLIC_ORDER_COLUMNS = new Set(['weekly_xp', 'monthly_xp', 'xp', 'level'])

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

function createHttpError(status, message, code) {
  const error = new Error(message)
  error.status = status
  error.code = code
  return error
}

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

function parseColumnList(rawSelect) {
  const trimmed = typeof rawSelect === 'string' ? rawSelect.trim() : ''
  if (!trimmed || trimmed === '*') {
    return { wildcard: true, columns: [] }
  }

  const columns = trimmed
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.replace(/\s+as\s+.*/i, '').trim())
    .filter(Boolean)

  if (!columns.length) {
    return { wildcard: true, columns: [] }
  }

  for (const column of columns) {
    if (!IDENTIFIER_RE.test(column)) {
      throw createHttpError(400, `Invalid column name: ${column}`, 'invalid_identifier')
    }
  }

  return { wildcard: false, columns }
}

function findEqFilter(filters, field) {
  return filters.find((filter) => filter.type === 'eq' && filter.field === field) || null
}

function enforceOwnerFilter(filters, ownerColumn, userId, isAdmin) {
  if (!ownerColumn || isAdmin) return filters

  const ownerFilter = findEqFilter(filters, ownerColumn)
  if (ownerFilter) {
    if (String(ownerFilter.value) !== userId) {
      throw createHttpError(403, 'Forbidden: cannot access data for another user.', 'forbidden')
    }
    return filters
  }

  return [...filters, { type: 'eq', field: ownerColumn, value: userId }]
}

function enforceOwnerOnRow(row, ownerColumn, userId, isAdmin) {
  if (!ownerColumn || isAdmin || !row || typeof row !== 'object') return row
  return { ...row, [ownerColumn]: userId }
}

function assertNoForbiddenWriteColumns(table, payload, forbiddenColumns) {
  const rows = normalizePayload(payload)
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue
    for (const column of Object.keys(row)) {
      if (forbiddenColumns.has(column)) {
        throw createHttpError(403, `Forbidden: cannot write column "${column}" on table "${table}".`, 'forbidden')
      }
    }
  }
}

function enforceUsersSelect(rawSelect) {
  const parsed = parseColumnList(rawSelect)
  if (parsed.wildcard) {
    return USERS_SAFE_SELECT_COLUMNS.join(', ')
  }

  const requested = parsed.columns.map((column) => column.toLowerCase())
  for (const column of requested) {
    if (USERS_FORBIDDEN_SELECT_COLUMNS.has(column)) {
      throw createHttpError(403, `Forbidden: column "${column}" is not selectable.`, 'forbidden')
    }
    if (!USERS_ALLOWED_SELECT_COLUMNS.has(column)) {
      throw createHttpError(403, `Forbidden: column "${column}" is not selectable.`, 'forbidden')
    }
  }

  return requested.join(', ')
}

function enforceUserProgressPublicSelect(rawSelect) {
  const parsed = parseColumnList(rawSelect)
  if (parsed.wildcard) {
    return Array.from(USER_PROGRESS_PUBLIC_COLUMNS).join(', ')
  }

  const requested = parsed.columns.map((column) => column.toLowerCase())
  for (const column of requested) {
    if (!USER_PROGRESS_PUBLIC_COLUMNS.has(column)) {
      throw createHttpError(403, `Forbidden: column "${column}" is not available for leaderboard reads.`, 'forbidden')
    }
  }

  return requested.join(', ')
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
    const auth = req.auth || {}
    const authUserId = String(auth.userId || '')
    const isAdmin = Boolean(auth.isAdmin)

    if (!authUserId) {
      throw createHttpError(401, 'Unauthorized: missing auth context.', 'unauthorized')
    }

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

    let effectiveFilters = filters
    const ownerColumn = ownerColumnByTable.get(table) || null
    const ownerEq = ownerColumn ? findEqFilter(effectiveFilters, ownerColumn) : null
    const ownerEqValue = ownerEq ? String(ownerEq.value) : null

    const isPublicUserProgressRead =
      table === 'user_progress' &&
      operation === 'select' &&
      !isAdmin &&
      ownerColumn === 'user_id' &&
      ownerEqValue !== authUserId

    if (isPublicUserProgressRead) {
      // Public leaderboard reads: only allow filters on public columns.
      effectiveFilters = filters.map((filter) => ({ ...filter, field: filter.field.toLowerCase() }))
      for (const filter of effectiveFilters) {
        if (!USER_PROGRESS_PUBLIC_COLUMNS.has(filter.field)) {
          throw createHttpError(403, `Forbidden: cannot filter leaderboard by "${filter.field}".`, 'forbidden')
        }
      }
    } else {
      // Enforce row ownership across all user-scoped tables.
      // Users can only access their own rows unless they have an admin token.
      effectiveFilters = enforceOwnerFilter(filters, ownerColumn, authUserId, isAdmin)
    }

    // Global table restrictions.
    if (!isAdmin && operation !== 'select' && NON_ADMIN_READ_ONLY_TABLES.has(table)) {
      throw createHttpError(403, `Forbidden: table "${table}" is read-only for non-admin users.`, 'forbidden')
    }

    if (table === 'users') {
      // Always scope users table to the current user unless admin explicitly requests otherwise.
      effectiveFilters = enforceOwnerFilter(effectiveFilters, 'id', authUserId, isAdmin)
      assertNoForbiddenWriteColumns(table, payload, USERS_FORBIDDEN_WRITE_COLUMNS)
    }

    if (!isAdmin && table === 'users') {
      assertNoForbiddenWriteColumns(table, payload, USERS_NON_ADMIN_FORBIDDEN_WRITE_COLUMNS)
    }

    if (!isAdmin && table === 'user_progress') {
      assertNoForbiddenWriteColumns(table, payload, USER_PROGRESS_NON_ADMIN_FORBIDDEN_WRITE_COLUMNS)
    }

    if (!isAdmin && NON_ADMIN_FORBIDDEN_WRITE_COLUMNS_BY_TABLE.has(table)) {
      assertNoForbiddenWriteColumns(
        table,
        payload,
        NON_ADMIN_FORBIDDEN_WRITE_COLUMNS_BY_TABLE.get(table)
      )
    }

    let effectiveSelect = select
    let effectiveReturning = returning
    let effectiveOrder = order

    if (operation === 'select') {
      if (table === 'users') {
        effectiveSelect = enforceUsersSelect(select)
      }

      if (isPublicUserProgressRead) {
        effectiveSelect = enforceUserProgressPublicSelect(select)
        if (effectiveOrder) {
          const orderColumn = effectiveOrder.column.toLowerCase()
          if (!USER_PROGRESS_PUBLIC_ORDER_COLUMNS.has(orderColumn)) {
            throw createHttpError(403, `Forbidden: cannot order leaderboard by "${effectiveOrder.column}".`, 'forbidden')
          }
          effectiveOrder = { ...effectiveOrder, column: orderColumn }
        }
      }
    } else {
      if (table === 'users') {
        effectiveReturning = enforceUsersSelect(returning)
      }
    }

    const tableSql = safeTable(table)
    const returningSql = effectiveReturning ? buildSelectList(effectiveReturning) : '*'

    if (operation === 'select') {
      const where = buildWhere(effectiveFilters, [])
      const orderSql = buildOrder(effectiveOrder)
      const limited = buildLimit(limit, where.nextIndex, where.params)
      const selectSql = buildSelectList(effectiveSelect)

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
      const rows = normalizePayload(payload).map((row) =>
        normalizeJsonColumns(table, enforceOwnerOnRow(row, ownerColumn, authUserId, isAdmin))
      )
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

      if (table === 'users') {
        assertNoForbiddenWriteColumns(table, payload, USERS_FORBIDDEN_WRITE_COLUMNS)
      }

      let updatePayload = payload

      if (!isAdmin && ownerColumn && Object.prototype.hasOwnProperty.call(updatePayload, ownerColumn)) {
        const requestedOwner = String(updatePayload[ownerColumn])
        if (requestedOwner !== authUserId) {
          throw createHttpError(403, `Forbidden: cannot change "${ownerColumn}" for this record.`, 'forbidden')
        }

        const { [ownerColumn]: _ignored, ...rest } = updatePayload
        updatePayload = rest
      }

      const normalizedPayload = normalizeJsonColumns(table, updatePayload)
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

      const where = buildWhere(effectiveFilters, params, params.length + 1)
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
      if (table === 'users' && !isAdmin) {
        throw createHttpError(403, 'Forbidden: users cannot be deleted via this API.', 'forbidden')
      }

      const where = buildWhere(effectiveFilters, [])
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
      const rows = normalizePayload(payload).map((row) =>
        normalizeJsonColumns(table, enforceOwnerOnRow(row, ownerColumn, authUserId, isAdmin))
      )
      if (rows.length === 0) {
        throw new Error('Upsert payload is required.')
      }

      if (table === 'users') {
        assertNoForbiddenWriteColumns(table, payload, USERS_FORBIDDEN_WRITE_COLUMNS)
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
    const status = Number(error?.status) || 400
    res.status(status).json({
      data: null,
      error: {
        code: error.code || 'query_error',
        message: error.message || 'Database query failed.',
      },
    })
  }
})

export { router as queryRouter }
