'use client'

import { useState, useRef, useTransition } from 'react'
import { deleteLibraryFile, toggleLibraryFile } from './actions'

interface LibraryFile {
  id: string
  title: string
  description?: string
  file_url: string
  file_name: string
  file_size?: number
  category?: string
  active: boolean
  created_at: string
}

export default function BibliotecaAdmin({ initialFiles }: { initialFiles: LibraryFile[] }) {
  const [files, setFiles] = useState<LibraryFile[]>(initialFiles)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setSelectedFile(f)
    if (!title) setTitle(f.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '))
  }

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      setError('Selecione um arquivo e preencha o título')
      return
    }
    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('title', title.trim())
      formData.append('description', description.trim())
      formData.append('category', category.trim())

      const res = await fetch('/api/biblioteca/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao fazer upload')

      setFiles(prev => [data.file, ...prev])
      setSuccess(`✓ "${title}" enviado com sucesso!`)
      setTitle('')
      setDescription('')
      setCategory('')
      setSelectedFile(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao fazer upload')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteLibraryFile(id)
        setFiles(prev => prev.filter(f => f.id !== id))
        setSuccess('✓ Arquivo removido')
      } catch {
        setError('Erro ao remover arquivo')
      }
    })
  }

  const handleToggle = (id: string) => {
    startTransition(async () => {
      try {
        const updated = await toggleLibraryFile(id)
        setFiles(prev => prev.map(f => f.id === id ? { ...f, active: updated.active } : f))
      } catch {
        setError('Erro ao atualizar status')
      }
    })
  }

  function formatBytes(bytes?: number) {
    if (!bytes) return ''
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Biblioteca — Admin</h1>
        <p className="text-gray-400 text-sm mt-0.5">Envie PDFs e materiais para os consultores</p>
      </div>

      {/* Feedback */}
      {success && (
        <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
          <span className="text-green-600 text-sm font-bold">{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-auto text-green-400 text-xs">✕</button>
        </div>
      )}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <span className="text-red-600 text-sm font-bold">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 text-xs">✕</button>
        </div>
      )}

      {/* Upload form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider">📤 Enviar novo material</h2>

        {/* File picker */}
        <label className="flex items-center gap-3 px-4 py-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#000FFF] transition-colors">
          <span className="text-3xl">📄</span>
          <div className="flex-1">
            {selectedFile ? (
              <>
                <p className="text-sm font-bold text-gray-800">{selectedFile.name}</p>
                <p className="text-xs text-gray-400">{formatBytes(selectedFile.size)}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-gray-700">Clique para escolher o PDF</p>
                <p className="text-xs text-gray-400">Apenas arquivos .pdf</p>
              </>
            )}
          </div>
          {selectedFile && (
            <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-1 rounded-lg">✓ Selecionado</span>
          )}
          <input ref={fileRef} type="file" accept=".pdf,application/pdf" onChange={handleFileSelect} className="hidden" />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Título *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Manual do App Ultragaz"
              className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:border-[#000FFF] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Categoria</label>
            <input
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="Ex: Canais Digitais, Vale Gás..."
              className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:border-[#000FFF] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Descrição (opcional)</label>
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Breve descrição do conteúdo..."
            className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:border-[#000FFF] focus:outline-none"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={uploading || !selectedFile || !title.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#000FFF] text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-40"
        >
          {uploading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Enviando...
            </>
          ) : '⬆️ Enviar para a Biblioteca'}
        </button>
      </div>

      {/* File list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider">📚 Arquivos ({files.length})</h2>
        </div>

        {files.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">Nenhum arquivo ainda</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {files.map(file => (
              <div key={file.id} className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${!file.active ? 'opacity-50 bg-gray-50' : ''}`}>
                <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 text-lg">📄</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{file.title}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {file.category && <span className="text-[#000FFF] font-semibold mr-1">{file.category} ·</span>}
                    {file.file_name} {file.file_size ? `· ${formatBytes(file.file_size)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Toggle ativo/inativo */}
                  <button
                    onClick={() => handleToggle(file.id)}
                    disabled={pending}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      file.active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {file.active ? '✓ Visível' : '○ Oculto'}
                  </button>
                  {/* Ver */}
                  <a
                    href={file.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-gray-400 hover:text-[#000FFF] transition-colors"
                    title="Visualizar"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </a>
                  {/* Deletar */}
                  <button
                    onClick={() => handleDelete(file.id)}
                    disabled={pending}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remover"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
