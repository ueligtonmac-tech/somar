import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function BibliotecaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: files } = await supabase
    .from('library_files')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })

  const categories = Array.from(new Set((files ?? []).map(f => f.category).filter(Boolean))) as string[]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Biblioteca</h1>
        <p className="text-gray-400 text-sm mt-0.5">Materiais e documentos para download</p>
      </div>

      {files && files.length > 0 ? (
        <div className="space-y-8">
          {/* Se há categorias, agrupa por elas */}
          {categories.length > 0 ? (
            categories.map(cat => {
              const catFiles = files.filter(f => f.category === cat)
              return (
                <div key={cat}>
                  <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-3">{cat}</h2>
                  <div className="grid gap-3">
                    {catFiles.map(file => (
                      <FileCard key={file.id} file={file} />
                    ))}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="grid gap-3">
              {files.map(file => (
                <FileCard key={file.id} file={file} />
              ))}
            </div>
          )}

          {/* Arquivos sem categoria */}
          {categories.length > 0 && files.filter(f => !f.category).length > 0 && (
            <div>
              <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-3">Outros</h2>
              <div className="grid gap-3">
                {files.filter(f => !f.category).map(file => (
                  <FileCard key={file.id} file={file} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">📂</div>
          <p className="text-gray-500 font-semibold">Nenhum material disponível ainda</p>
          <p className="text-gray-400 text-sm mt-1">Os materiais serão publicados em breve pela equipe Ultragaz</p>
        </div>
      )}
    </div>
  )
}

function formatBytes(bytes: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileCard({ file }: { file: { id: string; title: string; description?: string; file_url: string; file_name: string; file_size?: number; category?: string } }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:border-[#000FFF]/20 hover:shadow-md transition-all group">
      {/* Ícone PDF */}
      <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#fecaca" stroke="#ef4444" strokeWidth="1.5"/>
          <polyline points="14 2 14 8 20 8" stroke="#ef4444" strokeWidth="1.5" fill="none"/>
          <text x="6" y="19" fontSize="5.5" fontWeight="700" fill="#ef4444" fontFamily="system-ui">PDF</text>
        </svg>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">{file.title}</p>
        {file.description && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{file.description}</p>
        )}
        {file.file_size && (
          <p className="text-[10px] text-gray-300 mt-0.5">{formatBytes(file.file_size)}</p>
        )}
      </div>

      {/* Botão download */}
      <a
        href={file.file_url}
        target="_blank"
        rel="noopener noreferrer"
        download
        className="flex items-center gap-1.5 px-4 py-2 bg-[#000FFF] text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors flex-shrink-0 group-hover:shadow-md"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Baixar
      </a>
    </div>
  )
}
