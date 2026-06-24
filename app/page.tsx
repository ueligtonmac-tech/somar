import { createClient } from '@/lib/supabase/server'
import LandingPage from '@/components/LandingPage'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, email, role')
      .eq('id', user.id)
      .single()
    profile = data ?? { full_name: null, email: user.email ?? '', role: 'consultant' }
  }

  return <LandingPage profile={profile} />
}
