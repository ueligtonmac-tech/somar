import OpenAI from 'openai'

let client: OpenAI | null = null

function getClient() {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return client
}

/**
 * Gera embedding de 1536 dimensões usando text-embedding-3-small.
 * Retorna null se a chave não estiver configurada ou ocorrer erro.
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const key = process.env.OPENAI_API_KEY
  if (!key || key === 'your_openai_key') return null

  try {
    const res = await getClient().embeddings.create({
      model: 'text-embedding-3-small',
      input: text.replace(/\n/g, ' ').slice(0, 8000),
    })
    return res.data[0].embedding
  } catch (err) {
    console.error('[embedding] erro:', err)
    return null
  }
}

/**
 * Gera embeddings para um array de textos em batch (mais eficiente).
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<(number[] | null)[]> {
  const key = process.env.OPENAI_API_KEY
  if (!key || key === 'your_openai_key') return texts.map(() => null)

  try {
    const res = await getClient().embeddings.create({
      model: 'text-embedding-3-small',
      input: texts.map(t => t.replace(/\n/g, ' ').slice(0, 8000)),
    })
    return res.data.map(d => d.embedding)
  } catch (err) {
    console.error('[embedding batch] erro:', err)
    return texts.map(() => null)
  }
}
