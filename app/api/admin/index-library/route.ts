import { requireAdmin } from '@/lib/auth'
import { generateEmbeddingsBatch } from '@/lib/embeddings'
import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'

// Força runtime Node.js (necessário para pdf-parse)
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutos para processar todos os PDFs

// Extrai texto de um PDF via URL pública usando pdf-parse
async function extractTextFromUrl(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Falha ao baixar PDF: ${res.status}`)
  const buffer = await res.arrayBuffer()
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse/lib/pdf-parse')
  const data = await pdfParse(Buffer.from(buffer))
  return (data.text as string) || ''
}

// Divide o texto em chunks com overlap para manter contexto
function chunkText(text: string, maxChars = 800, overlap = 150): string[] {
  const paragraphs = text
    .split(/\n{2,}/)
    .map(p => p.replace(/\s+/g, ' ').trim())
    .filter(p => p.length > 30)

  const chunks: string[] = []
  let current = ''

  for (const para of paragraphs) {
    if ((current + '\n' + para).length > maxChars) {
      if (current) {
        chunks.push(current.trim())
        // Overlap: pega o final do chunk anterior
        const words = current.split(' ')
        current = words.slice(-Math.floor(overlap / 6)).join(' ') + '\n' + para
      } else {
        // Parágrafo maior que maxChars — divide por frases
        const sentences = para.match(/[^.!?]+[.!?]+/g) || [para]
        for (const s of sentences) {
          if ((current + ' ' + s).length > maxChars) {
            if (current) chunks.push(current.trim())
            current = s
          } else {
            current += ' ' + s
          }
        }
      }
    } else {
      current += (current ? '\n' : '') + para
    }
  }
  if (current.trim().length > 30) chunks.push(current.trim())
  return chunks
}

// GET — retorna status de indexação da biblioteca
export async function GET() {
  try {
    const { service } = await requireAdmin()

    const [total] = await Promise.all([
      service.from('library_files').select('*', { count: 'exact', head: true }).eq('active', true),
    ])

    const indexedIds = (await service
      .from('document_chunks')
      .select('document_id')
    ).data?.map(d => d.document_id) ?? []

    const uniqueIndexed = new Set(indexedIds).size

    const chunkCount = await service
      .from('document_chunks')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      total: total.count ?? 0,
      indexed: uniqueIndexed,
      totalChunks: chunkCount.count ?? 0,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST — indexa todos os PDFs da biblioteca que ainda não têm chunks
export async function POST(req: NextRequest) {
  try {
    const { service } = await requireAdmin()

    const { reindex } = await req.json().catch(() => ({ reindex: false }))

    // Busca todos os arquivos ativos
    const { data: files, error } = await service
      .from('library_files')
      .select('id, title, file_url, file_name')
      .eq('active', true)

    if (error) throw new Error(error.message)
    if (!files?.length) return NextResponse.json({ ok: true, message: 'Nenhum arquivo na biblioteca.', indexed: 0 })

    // Se não for reindex, filtra apenas os que ainda não têm chunks
    let toProcess = files
    if (!reindex) {
      const { data: alreadyIndexed } = await service
        .from('document_chunks')
        .select('document_id')
      const doneIds = new Set((alreadyIndexed ?? []).map(d => d.document_id))
      toProcess = files.filter(f => !doneIds.has(f.id))
    }

    if (!toProcess.length) {
      return NextResponse.json({ ok: true, message: 'Todos os arquivos já estão indexados!', indexed: 0 })
    }

    let totalChunks = 0
    let errors = 0
    const processed: string[] = []
    const errorDetails: string[] = []

    for (const file of toProcess) {
      try {
        logger.info('Indexando PDF', { context: 'index-library', data: { title: file.title } })

        // Extrai texto
        const text = await extractTextFromUrl(file.file_url)
        if (!text || text.trim().length < 50) {
          logger.warn('PDF sem texto extraível', { context: 'index-library', data: { title: file.title } })
          errorDetails.push(`"${file.title}": sem texto extraível (${text?.trim().length ?? 0} chars)`)
          errors++
          continue
        }

        // Divide em chunks
        const chunks = chunkText(text)
        if (!chunks.length) {
          errorDetails.push(`"${file.title}": chunkText retornou 0 chunks`)
          errors++
          continue
        }

        // Se reindex, remove chunks antigos
        if (reindex) {
          await service.from('document_chunks').delete().eq('document_id', file.id)
        }

        // Gera embeddings em lote
        const embeddings = await generateEmbeddingsBatch(chunks)

        // Insere chunks com embeddings
        const inserts = chunks.map((content, i) => ({
          document_id: file.id,
          content,
          embedding: embeddings[i] ?? null,
          metadata: { title: file.title, chunk_index: i, total_chunks: chunks.length },
        }))

        const { error: insertErr } = await service
          .from('document_chunks')
          .insert(inserts)

        if (insertErr) {
          logger.error('Erro ao inserir chunks', { context: 'index-library', error: insertErr, data: { title: file.title } })
          errorDetails.push(`"${file.title}": insert error — ${insertErr.message}`)
          errors++
        } else {
          totalChunks += chunks.length
          processed.push(file.title)
          logger.info('PDF indexado', { context: 'index-library', data: { title: file.title, chunks: chunks.length } })
        }
      } catch (fileErr: unknown) {
        const errMsg = fileErr instanceof Error ? fileErr.message : String(fileErr)
        logger.error('Erro ao processar PDF', { context: 'index-library', error: fileErr, data: { title: file.title } })
        errorDetails.push(`"${file.title}": ${errMsg}`)
        errors++
      }
    }

    const msg = errors > 0
      ? `Indexados ${processed.length} arquivos (${totalChunks} trechos). Falhas: ${errors}.`
      : `✅ ${processed.length} PDF(s) indexados com sucesso! Total: ${totalChunks} trechos de conteúdo.`

    return NextResponse.json({ ok: true, message: msg, indexed: processed.length, chunks: totalChunks, errors, files: processed, errorDetails })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao indexar biblioteca'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
