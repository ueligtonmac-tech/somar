/**
 * Testes unitários — lib/logger.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
  vi.clearAllMocks()
})

async function getLogger() {
  const mod = await import('../lib/logger')
  return mod.logger
}

describe('logger (desenvolvimento — NODE_ENV != production)', () => {
  it('logger.info chama console.log', async () => {
    vi.stubEnv('NODE_ENV', 'test')
    const logger = await getLogger()
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    logger.info('mensagem de info', { context: 'teste' })
    expect(spy).toHaveBeenCalledOnce()
    spy.mockRestore()
  })

  it('logger.warn chama console.warn', async () => {
    vi.stubEnv('NODE_ENV', 'test')
    const logger = await getLogger()
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logger.warn('alerta aqui')
    expect(spy).toHaveBeenCalledOnce()
    spy.mockRestore()
  })

  it('logger.error chama console.error', async () => {
    vi.stubEnv('NODE_ENV', 'test')
    const logger = await getLogger()
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    logger.error('erro crítico', { error: new Error('falha') })
    expect(spy).toHaveBeenCalledOnce()
    spy.mockRestore()
  })

  it('logger.debug chama console.log', async () => {
    vi.stubEnv('NODE_ENV', 'test')
    const logger = await getLogger()
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    logger.debug('debug msg')
    expect(spy).toHaveBeenCalledOnce()
    spy.mockRestore()
  })
})

describe('logger (produção) — serializa como JSON', () => {
  it('emite JSON válido com o nível correto', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.resetModules()
    const logger = await getLogger()

    const messages: string[] = []
    const spy = vi.spyOn(console, 'log').mockImplementation((msg: string) => {
      messages.push(msg)
    })

    logger.info('operação concluída', { context: 'api/chat', durationMs: 250 })

    expect(spy).toHaveBeenCalledOnce()
    const parsed = JSON.parse(messages[0])
    expect(parsed.level).toBe('info')
    expect(parsed.msg).toBe('operação concluída')
    expect(parsed.ctx).toBe('api/chat')
    expect(parsed.durationMs).toBe(250)
    expect(parsed.ts).toBeTruthy()
    spy.mockRestore()
  })

  it('serializa instâncias de Error corretamente', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.resetModules()
    const logger = await getLogger()

    const messages: string[] = []
    const spy = vi.spyOn(console, 'error').mockImplementation((msg: string) => {
      messages.push(msg)
    })

    const err = new Error('timeout na API')
    logger.error('falha no RAG', { context: 'rag/sync', error: err })

    const parsed = JSON.parse(messages[0])
    expect(parsed.error.name).toBe('Error')
    expect(parsed.error.message).toBe('timeout na API')
    expect(parsed.error.stack).toContain('Error')
    spy.mockRestore()
  })

  it('não inclui campos undefined no JSON final', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.resetModules()
    const logger = await getLogger()

    const messages: string[] = []
    const spy = vi.spyOn(console, 'log').mockImplementation((msg: string) => {
      messages.push(msg)
    })

    logger.info('ok')

    const parsed = JSON.parse(messages[0])
    expect(Object.keys(parsed)).not.toContain('userId')
    expect(Object.keys(parsed)).not.toContain('durationMs')
    spy.mockRestore()
  })
})
