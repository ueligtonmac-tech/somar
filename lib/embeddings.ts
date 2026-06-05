import { GoogleGenerativeAI } from '@google/generative-ai'

let client: GoogleGenerativeAI | null = null

function getClient() {
  if (!client) client = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_KEY!)
  return client
}

function isConfigured() {
  const key = process.env.GOOGLE_GENERATIVE_AI_KEY
  return !!key && key !== 'your_gemini_key'
}

/**
 * Gera embedding de 768 dimensões usando Google text-embedding-004.
 * Retorna null se a chave não estiver configurada ou ocorrer erro.
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!isConfigured()) return null

  try {
    const model = getClient().getGenerativeModel({ model: 'text-embedding-004' })
    const result = await model.embedContent(text.replace(/\n/g, ' ').slice(0, 8000))
    return result.embedding.values
  } catch (err) {
    console.error('[embedding] erro:', err)
    return null
  }
}

/**
 * Gera embeddings para um array de textos (sequencial para respeitar rate limits).
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<(number[] | null)[]> {
  if (!isConfigured()) return texts.map(() => null)

  const results: (number[] | null)[] = []
  for (const text of texts) {
    const embedding = await generateEmbedding(text)
    results.push(embedding)
    // Pequeno delay para evitar rate limit
    await new Promise(r => setTimeout(r, 100))
  }
  return results
}
