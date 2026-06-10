/**
 * Testes unitários — lib/embeddings.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockCreate = vi.fn()

// Mock via factory — usa função construtora real
vi.mock('openai', () => ({
  default: class MockOpenAI {
    embeddings = { create: mockCreate }
  },
}))

let generateEmbedding: (text: string) => Promise<number[] | null>
let generateEmbeddingsBatch: (texts: string[]) => Promise<(number[] | null)[]>

beforeEach(async () => {
  vi.resetModules()
  vi.clearAllMocks()

  const mod = await import('../lib/embeddings')
  generateEmbedding = mod.generateEmbedding
  generateEmbeddingsBatch = mod.generateEmbeddingsBatch
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('generateEmbedding', () => {
  it('retorna null quando a chave não está configurada', async () => {
    vi.stubEnv('OPENAI_API_KEY', '')
    const result = await generateEmbedding('teste')
    expect(result).toBeNull()
  })

  it('retorna null quando a chave é placeholder', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'your_openai_key')
    const result = await generateEmbedding('teste')
    expect(result).toBeNull()
  })

  it('retorna null quando a chave não começa com sk-', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'invalid-key')
    const result = await generateEmbedding('teste')
    expect(result).toBeNull()
  })

  it('retorna embedding quando a chave é válida', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-fakekey')
    const fakeEmbedding = Array.from({ length: 1536 }, (_, i) => i * 0.001)

    mockCreate.mockResolvedValueOnce({
      data: [{ embedding: fakeEmbedding, index: 0 }],
    })

    const result = await generateEmbedding('consultor Ultragaz')
    expect(result).toEqual(fakeEmbedding)
    expect(result).toHaveLength(1536)
    expect(mockCreate).toHaveBeenCalledOnce()
  })

  it('retorna null quando a API lança erro', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-fakekey')
    mockCreate.mockRejectedValueOnce(new Error('API indisponível'))

    const result = await generateEmbedding('teste')
    expect(result).toBeNull()
  })
})

describe('generateEmbeddingsBatch', () => {
  it('retorna array de nulls quando a chave não está configurada', async () => {
    vi.stubEnv('OPENAI_API_KEY', '')
    const result = await generateEmbeddingsBatch(['a', 'b', 'c'])
    expect(result).toEqual([null, null, null])
  })

  it('retorna embeddings na ordem correta (reordena por index)', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-fakekey')
    const emb0 = [0.1, 0.2]
    const emb1 = [0.3, 0.4]

    // API retorna em ordem invertida — deve reordenar por index
    mockCreate.mockResolvedValueOnce({
      data: [
        { embedding: emb1, index: 1 },
        { embedding: emb0, index: 0 },
      ],
    })

    const result = await generateEmbeddingsBatch(['texto 1', 'texto 2'])
    expect(result[0]).toEqual(emb0)
    expect(result[1]).toEqual(emb1)
  })

  it('trunca textos longos para 8000 chars antes de enviar', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-fakekey')
    const longText = 'a'.repeat(10_000)

    mockCreate.mockResolvedValueOnce({
      data: [{ embedding: [0.5], index: 0 }],
    })

    await generateEmbeddingsBatch([longText])

    const callArg = mockCreate.mock.calls[0][0]
    expect(callArg.input[0].length).toBeLessThanOrEqual(8000)
  })
})
