/**
 * Testes unitários — rate limiting do middleware
 * Extrai a lógica de checkRateLimit para testar isoladamente.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// ── Re-implementa checkRateLimit para teste (espelha middleware.ts) ──────────

type RateStore = Map<string, [number, number]>

function makeRateLimiter(limits: Record<string, [number, number]>) {
  const store: RateStore = new Map()

  function check(userId: string, pathname: string): boolean {
    const route = Object.keys(limits).find(r => pathname.startsWith(r))
    if (!route) return true

    const [max, windowMs] = limits[route]
    const key = `${userId}:${route}`
    const now = Date.now()
    const entry = store.get(key)

    if (!entry || now - entry[1] > windowMs) {
      store.set(key, [1, now])
      return true
    }

    if (entry[0] >= max) return false
    entry[0]++
    return true
  }

  return { check, store }
}

const TEST_LIMITS: Record<string, [number, number]> = {
  '/api/chat': [3, 60_000],         // max 3 por minuto
  '/api/rag/sync': [2, 3_600_000],  // max 2 por hora
}

describe('checkRateLimit', () => {
  let limiter: ReturnType<typeof makeRateLimiter>

  beforeEach(() => {
    limiter = makeRateLimiter(TEST_LIMITS as Record<string, [number, number]>)
  })

  it('permite a primeira requisição', () => {
    expect(limiter.check('user1', '/api/chat')).toBe(true)
  })

  it('permite até o limite máximo', () => {
    expect(limiter.check('user1', '/api/chat')).toBe(true)  // 1
    expect(limiter.check('user1', '/api/chat')).toBe(true)  // 2
    expect(limiter.check('user1', '/api/chat')).toBe(true)  // 3
  })

  it('bloqueia quando ultrapassa o limite', () => {
    limiter.check('user1', '/api/chat') // 1
    limiter.check('user1', '/api/chat') // 2
    limiter.check('user1', '/api/chat') // 3
    expect(limiter.check('user1', '/api/chat')).toBe(false) // 4 — bloqueado
  })

  it('não mistura contadores de usuários diferentes', () => {
    limiter.check('user1', '/api/chat') // 1
    limiter.check('user1', '/api/chat') // 2
    limiter.check('user1', '/api/chat') // 3

    // user2 não deve ser afetado
    expect(limiter.check('user2', '/api/chat')).toBe(true)
  })

  it('não mistura contadores de rotas diferentes', () => {
    limiter.check('user1', '/api/chat')      // 1
    limiter.check('user1', '/api/chat')      // 2
    limiter.check('user1', '/api/chat')      // 3 — chegou no limite de /api/chat

    // /api/rag/sync tem limite separado
    expect(limiter.check('user1', '/api/rag/sync')).toBe(true)
  })

  it('permite rotas sem limite configurado', () => {
    expect(limiter.check('user1', '/api/qualquer-outra-rota')).toBe(true)
    expect(limiter.check('user1', '/api/qualquer-outra-rota')).toBe(true)
    expect(limiter.check('user1', '/api/qualquer-outra-rota')).toBe(true)
    expect(limiter.check('user1', '/api/qualquer-outra-rota')).toBe(true)
  })

  it('reseta o contador após expiração da janela', () => {
    // Esgotar o limite
    limiter.check('user1', '/api/chat')
    limiter.check('user1', '/api/chat')
    limiter.check('user1', '/api/chat')
    expect(limiter.check('user1', '/api/chat')).toBe(false)

    // Simular janela expirada manipulando o store diretamente
    const key = 'user1:/api/chat'
    const entry = limiter.store.get(key)!
    entry[1] = Date.now() - 61_000 // 61 segundos atrás

    // Agora deve ser permitido novamente
    expect(limiter.check('user1', '/api/chat')).toBe(true)
  })

  it('faz match por prefixo de rota', () => {
    // /api/chat/transcribe começa com /api/chat → usa limite de /api/chat
    // Mas se /api/chat/transcribe fosse listado primeiro, usaria ele
    expect(limiter.check('user1', '/api/chat/history')).toBe(true)
  })
})
