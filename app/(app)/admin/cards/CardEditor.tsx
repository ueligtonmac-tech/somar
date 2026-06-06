'use client'

import { useState, useTransition, useRef } from 'react'
import { updateCard, deleteCard, uploadCardPdf, reorderCards } from '../actions'

interface Card {
  id: string
  title: string
  module_id: string
  scenario: string | null
  challenge: string | null
  explanation: string | null
  action_hint: string | null
  video_url: string | null
  pdf_url: string | null
  pdf_name: string | null
  published: boolean
  order_index: number
}

type ValuesKey = 'title' | 'scenario' | 'challenge' | 'explanation' | 'action_hint' | 'video_url'

const TEXT_FIELDS: { key: ValuesKey; label: string; rows: number; hint?: string }[] = [
  { key: 'title',       label: 'Título',       rows: 1 },
  { key: 'scenario',    label: 'Cenário',      rows: 2, hint: 'Contexto/situação apresentada ao consultor' },
  { key: 'challenge',   label: 'Desafio',      rows: 2, hint: 'Pergunta ou problema a resolver' },
  { key: 'explanation', label: 'Explicação',   rows: 5, hint: 'Resposta completa com detalhes' },
  { key: 'action_hint', label: 'Dica de Ação', rows: 2, hint: 'Conselho prático para aplicar' },
]

function extractYoutubeId(url: string) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
  return match ? match[1] : null
}
function extractVimeoId(url: string) {
  const match = url.match(/vimeo\.com\/(\d+)/)
  return match ? match[1] : null
}
function getEmbedUrl(url: string) {
  if (!url) return null
  const ytId = extractYoutubeId(url)
  if (ytId) return `https://www.youtube.com/embed/${ytId}`
  const vId = extractVimeoId(url)
  if (vId) return `https://player.vimeo.com/video/${vId}`
  return url
}

export default function CardEditor({
  card,
  index,
  moduleCardIds,
}: {
  card: Card
  index: number
  moduleCardIds: string[]
}) {
  const [expanded, setExpanded] = useState(false)
  const [tab, setTab] = useState<'content' | 'media'>('content')
  const [values, setValues] = useState({
    title:       card.title       ?? '',
    scenario:    card.scenario    ?? '',
    challenge:   card.challenge   ?? '',
    explanation: card.explanation ?? '',
    action_hint: card.action_hint ?? '',
    video_url:   card.video_url   ?? '',
  })
  const [pdfUrl, setPdfUrl] = useState(card.pdf_url ?? '')
  const [pdfName, setPdfName] = useState(card.pdf_name ?? '')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  const embedUrl = getEmbedUrl(values.video_url)

  const handleSave = () => {
    startTransition(async () => {
      await updateCard(card.id, {
        ...values,
        video_url: values.video_url || undefined,
        pdf_url: pdfUrl || undefined,
        pdf_name: pdfName || undefined,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  const handleTogglePublish = () => {
    startTransition(() => updateCard(card.id, { published: !card.published }))
  }

  const handleDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); return }
    startTransition(() => deleteCard(card.id))
  }

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 50 * 1024 * 1024) { alert('PDF deve ter no máximo 50MB'); return }

    setUploading(true)
    setUploadProgress(30)

    try {
      const formData = new FormData()
      formData.append('file', file)
      setUploadProgress(60)
      const result = await uploadCardPdf(card.id, formData)
      setPdfUrl(result.url)
      setPdfName(result.name)
      setUploadProgress(100)
      setTimeout(() => { setUploading(false); setUploadProgress(0) }, 800)
    } catch (err: unknown) {
      alert('Erro no upload: ' + (err instanceof Error ? err.message : String(err)))
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const hasMedia = values.video_url || pdfUrl

  return (
    <div className={`transition-colors ${pending ? 'opacity-60' : ''}`}>
      {/* Header colapsável */}
      <div className="flex items-center gap-2 px-4 md:px-6 hover:bg-gray-50 transition-colors">
        {/* Setas de reordenação */}
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <button
            disabled={index === 1 || pending}
            onClick={e => {
              e.stopPropagation()
              const ids = [...moduleCardIds]
              const pos = ids.indexOf(card.id)
              if (pos <= 0) return
              ;[ids[pos - 1], ids[pos]] = [ids[pos], ids[pos - 1]]
              startTransition(() => reorderCards(card.module_id ?? '', ids))
            }}
            className="w-5 h-5 rounded flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-20 transition-colors"
            title="Mover para cima"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 15l-6-6-6 6"/></svg>
          </button>
          <button
            disabled={index === moduleCardIds.length || pending}
            onClick={e => {
              e.stopPropagation()
              const ids = [...moduleCardIds]
              const pos = ids.indexOf(card.id)
              if (pos >= ids.length - 1) return
              ;[ids[pos], ids[pos + 1]] = [ids[pos + 1], ids[pos]]
              startTransition(() => reorderCards(card.module_id ?? '', ids))
            }}
            className="w-5 h-5 rounded flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-20 transition-colors"
            title="Mover para baixo"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
          </button>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex-1 flex items-center gap-3 py-4 text-left"
        >
          <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
            {index}
          </span>
          <span className="flex-1 font-semibold text-sm text-gray-800 truncate">{values.title || card.title}</span>
          <div className="flex items-center gap-2 flex-shrink-0">
            {hasMedia && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-bold">
                {values.video_url && pdfUrl ? '🎬 PDF' : values.video_url ? '🎬 Vídeo' : '📄 PDF'}
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${card.published ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
              {card.published ? 'Publicado' : 'Rascunho'}
            </span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5"
            className={`flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}>
            <path d="M6 9l6 6 6-6" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Formulário expandido */}
      {expanded && (
        <div className="border-t border-gray-50 bg-gray-50/50">
          {/* Tabs */}
          <div className="flex gap-1 px-6 pt-4">
            {(['content', 'media'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  tab === t ? 'bg-[#000FFF] text-white' : 'bg-white text-gray-500 hover:bg-gray-100'
                }`}
              >
                {t === 'content' ? '📝 Conteúdo' : `🎬 Mídia ${hasMedia ? '●' : ''}`}
              </button>
            ))}
          </div>

          <div className="px-6 pb-6 pt-4 space-y-4">
            {/* TAB: Conteúdo */}
            {tab === 'content' && (
              <>
                {TEXT_FIELDS.map(({ key, label, rows, hint }) => (
                  <div key={key}>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      {label}
                    </label>
                    {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
                    {rows === 1 ? (
                      <input
                        type="text"
                        value={values[key] as string}
                        onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                        className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-[#000FFF] focus:outline-none transition-colors bg-white"
                      />
                    ) : (
                      <textarea
                        rows={rows}
                        value={values[key] as string}
                        onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                        className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-[#000FFF] focus:outline-none transition-colors resize-none leading-relaxed bg-white"
                      />
                    )}
                  </div>
                ))}
              </>
            )}

            {/* TAB: Mídia */}
            {tab === 'media' && (
              <div className="space-y-6">
                {/* Vídeo */}
                <div className="bg-white rounded-xl border-2 border-gray-100 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🎬</span>
                    <div>
                      <p className="text-sm font-bold text-gray-800">Vídeo</p>
                      <p className="text-xs text-gray-400">Cole a URL do YouTube ou Vimeo</p>
                    </div>
                  </div>
                  <input
                    type="url"
                    value={values.video_url}
                    onChange={e => setValues(v => ({ ...v, video_url: e.target.value }))}
                    placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:border-[#000FFF] focus:outline-none transition-colors"
                  />
                  {values.video_url && embedUrl && (
                    <div className="mt-3 rounded-xl overflow-hidden aspect-video bg-black">
                      <iframe
                        src={embedUrl}
                        className="w-full h-full"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    </div>
                  )}
                  {values.video_url && !embedUrl && (
                    <p className="text-xs text-red-500 mt-2">URL não reconhecida como YouTube ou Vimeo.</p>
                  )}
                </div>

                {/* PDF */}
                <div className="bg-white rounded-xl border-2 border-gray-100 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">📄</span>
                    <div>
                      <p className="text-sm font-bold text-gray-800">PDF para Download</p>
                      <p className="text-xs text-gray-400">Máximo 50 MB</p>
                    </div>
                  </div>

                  {pdfUrl ? (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <span className="text-2xl">📄</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{pdfName || 'Arquivo PDF'}</p>
                        <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-[#000FFF] font-medium hover:underline">
                          Visualizar →
                        </a>
                      </div>
                      <button
                        onClick={() => { setPdfUrl(''); setPdfName('') }}
                        className="text-red-400 hover:text-red-600 transition-colors p-1"
                        title="Remover PDF"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} />
                      <button
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#000FFF] hover:bg-blue-50/30 transition-all cursor-pointer group"
                      >
                        {uploading ? (
                          <div>
                            <p className="text-sm font-semibold text-gray-600 mb-2">Enviando... {uploadProgress}%</p>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-[#000FFF] rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                            </div>
                          </div>
                        ) : (
                          <>
                            <svg className="mx-auto mb-2 text-gray-300 group-hover:text-[#000FFF] transition-colors" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                            <p className="text-sm font-semibold text-gray-500 group-hover:text-[#000FFF]">Clique para fazer upload do PDF</p>
                            <p className="text-xs text-gray-400 mt-1">ou arraste e solte aqui</p>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="flex items-center gap-3 pt-2 flex-wrap">
              <button
                onClick={handleSave}
                disabled={pending}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  saved ? 'bg-green-500 text-white'
                  : 'bg-[#000FFF] text-white hover:bg-blue-700 disabled:opacity-60'
                }`}
              >
                {saved ? '✓ Salvo!' : pending ? 'Salvando...' : 'Salvar alterações'}
              </button>

              <button
                onClick={handleTogglePublish}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-colors ${
                  card.published
                    ? 'border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500'
                    : 'border-[#000FFF] text-[#000FFF] hover:bg-[#000FFF] hover:text-white'
                }`}
              >
                {card.published ? 'Despublicar' : 'Publicar'}
              </button>

              <button
                onClick={handleDelete}
                className={`ml-auto px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-colors ${
                  confirmDelete
                    ? 'border-red-500 bg-red-500 text-white'
                    : 'border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500'
                }`}
              >
                {confirmDelete ? '⚠ Confirmar exclusão' : 'Excluir card'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
