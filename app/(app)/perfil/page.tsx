import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from './ProfileForm'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role, whatsapp')
    .eq('id', user.id)
    .single()

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Meu Perfil</h1>
        <p className="text-gray-400 text-sm mt-0.5">Atualize suas informações pessoais</p>
      </div>
      <ProfileForm
        userId={user.id}
        profile={profile ?? { full_name: null, email: user.email ?? '', role: 'consultant', whatsapp: null }}
      />
    </div>
  )
}
