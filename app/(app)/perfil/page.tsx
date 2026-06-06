import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
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
      <div className="flex items-center gap-4 mb-8">
        <Link href="/trilha" className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Meu Perfil</h1>
          <p className="text-gray-400 text-sm mt-0.5">Atualize suas informações pessoais</p>
        </div>
      </div>
      <ProfileForm
        userId={user.id}
        profile={profile ?? { full_name: null, email: user.email ?? '', role: 'consultant', whatsapp: null }}
      />
    </div>
  )
}
