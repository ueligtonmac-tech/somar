import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import BibliotecaAdmin from './BibliotecaAdmin'

export default async function AdminBibliotecaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: me } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'builder'].includes(me.role)) redirect('/trilha')

  const { data: files } = await service
    .from('library_files')
    .select('*')
    .order('created_at', { ascending: false })

  return <BibliotecaAdmin initialFiles={files ?? []} />
}
