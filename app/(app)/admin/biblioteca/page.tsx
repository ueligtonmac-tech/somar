import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BibliotecaAdmin from './BibliotecaAdmin'

export default async function AdminBibliotecaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'builder'].includes(me.role)) redirect('/trilha')

  const { data: files } = await supabase
    .from('library_files')
    .select('*')
    .order('created_at', { ascending: false })

  return <BibliotecaAdmin initialFiles={files ?? []} />
}
