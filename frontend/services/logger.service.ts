interface ErrorMetadata {
  [key: string]: unknown
}

function normalizeError(error: unknown): { message: string; name?: string; stack?: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    }
  }

  if (error && typeof error === 'object') {
    const maybeError = error as { message?: unknown; name?: unknown; stack?: unknown }
    return {
      message:
        typeof maybeError.message === 'string'
          ? maybeError.message
          : JSON.stringify(error),
      name: typeof maybeError.name === 'string' ? maybeError.name : undefined,
      stack: typeof maybeError.stack === 'string' ? maybeError.stack : undefined,
    }
  }

  return {
    message: String(error),
  }
}

export function reportError(scope: string, error: unknown, metadata?: ErrorMetadata): void {
  const normalized = normalizeError(error)

  if (import.meta.env.DEV) {
    console.error(`[${scope}] ${normalized.message}`, {
      error: normalized,
      metadata: metadata ?? {},
    })
    return
  }

  // Keep logs lean in production until a telemetry sink is plugged in.
  console.error(`[${scope}] ${normalized.message}`)
}
