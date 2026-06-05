import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
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
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Biblioteca</h1>
        <p className="text-gray-400 text-sm mt-0.5">Materiais para download · Pergunte ao Bot João sobre qualquer conteúdo</p>
      </div>
      <BibliotecaClient files={files ?? []} />
    </div>
  )
}
