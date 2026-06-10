/**
 * Logger estruturado — produção gera JSON legível pelo Vercel Log Drain / Sentry.
 * Desenvolvimento usa cores no console para facilitar a leitura.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogPayload {
  level: LogLevel
  message: string
  context?: string       // ex: 'api/chat', 'rag/sync', 'middleware'
  userId?: string
  error?: unknown
  data?: Record<string, unknown>
  durationMs?: number
}

function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
    }
  }
  return { raw: String(err) }
}

function log(payload: LogPayload) {
  const isDev = process.env.NODE_ENV !== 'production'
  const ts = new Date().toISOString()

  const entry = {
    ts,
    level: payload.level,
    ctx: payload.context,
    msg: payload.message,
    userId: payload.userId,
    durationMs: payload.durationMs,
    data: payload.data,
    ...(payload.error ? { error: serializeError(payload.error) } : {}),
  }

  // Remove undefined fields
  const clean = Object.fromEntries(
    Object.entries(entry).filter(([, v]) => v !== undefined)
  )

  if (isDev) {
    const colors: Record<LogLevel, string> = {
      debug: '\x1b[36m', // ciano
      info:  '\x1b[32m', // verde
      warn:  '\x1b[33m', // amarelo
      error: '\x1b[31m', // vermelho
    }
    const reset = '\x1b[0m'
    const prefix = `${colors[payload.level]}[${payload.level.toUpperCase()}]${reset}`
    const ctx = payload.context ? ` (${payload.context})` : ''
    const msg = `${prefix}${ctx} ${payload.message}`

    if (payload.level === 'error') {
      console.error(msg, payload.error ?? '', payload.data ?? '')
    } else if (payload.level === 'warn') {
      console.warn(msg, payload.data ?? '')
    } else {
      console.log(msg, payload.data ?? '')
    }
  } else {
    // Produção: JSON numa linha — compatível com Vercel, Sentry, Datadog, etc.
    const fn = payload.level === 'error' ? console.error
             : payload.level === 'warn'  ? console.warn
             : console.log
    fn(JSON.stringify(clean))
  }
}

export const logger = {
  debug: (message: string, opts?: Omit<LogPayload, 'level' | 'message'>) =>
    log({ level: 'debug', message, ...opts }),

  info: (message: string, opts?: Omit<LogPayload, 'level' | 'message'>) =>
    log({ level: 'info', message, ...opts }),

  warn: (message: string, opts?: Omit<LogPayload, 'level' | 'message'>) =>
    log({ level: 'warn', message, ...opts }),

  error: (message: string, opts?: Omit<LogPayload, 'level' | 'message'>) =>
    log({ level: 'error', message, ...opts }),
}
