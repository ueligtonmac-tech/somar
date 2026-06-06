import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BibliotecaClient from './BibliotecaClient'

export default async function BibliotecaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: files } = await supabase
    .from('library_files')
    .select('id, title, description, file_url, file_name, file_size, category')
    .eq('active', true)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/trilha" className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Biblioteca</h1>
          <p className="text-gray-400 text-sm mt-0.5">Materiais para download · Pergunte ao Bot João sobre qualquer conteúdo</p>
        </div>
      </div>
      <BibliotecaClient files={files ?? []} />
    </div>
  )
}
