interface TimestampLike {
  toDate: () => Date
}

function isTimestampLike(value: unknown): value is TimestampLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  )
}

export function toDateOrNull(value: unknown): Date | null {
  if (value == null) return null
  if (value instanceof Date) return value

  if (isTimestampLike(value)) {
    try {
      return value.toDate()
    } catch {
      return null
    }
  }

  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function toDateOrNow(value: unknown): Date {
  return toDateOrNull(value) ?? new Date()
}
