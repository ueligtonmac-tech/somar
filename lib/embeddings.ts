import OpenAI from 'openai'

let client: OpenAI | null = null

function getClient() {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return client
}

function isConfigured() {
  const key = process.env.OPENAI_API_KEY
  return !!key && key !== 'your_openai_key' && key.startsWith('sk-')
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!isConfigured()) return null
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

export async function generateEmbeddingsBatch(texts: string[]): Promise<(number[] | null)[]> {
  if (!isConfigured()) return texts.map(() => null)
  try {
    const res = await getClient().embeddings.create({
      model: 'text-embedding-3-small',
      input: texts.map(t => t.replace(/\n/g, ' ').slice(0, 8000)),
    })
    return res.data.sort((a, b) => a.index - b.index).map(d => d.embedding)
  } catch (err) {
    console.error('[embedding batch] erro:', err)
    return texts.map(() => null)
  }
}

export async function generateQueryEmbedding(text: string): Promise<number[] | null> {
  return generateEmbedding(text)
}
