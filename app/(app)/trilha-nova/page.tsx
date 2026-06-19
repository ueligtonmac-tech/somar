import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TrailHomeClient from './TrailHomeClient'

export default async function TrailNovaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: blocks }, { data: sections }, { data: progress }, { data: badges }] = await Promise.all([
    supabase.from('trail_blocks').select('*').order('order_index'),
    supabase.from('trail_sections').select('id, block_id, title, order_index, points_value').order('order_index'),
    supabase.from('trail_user_progress').select('*').eq('user_id', user.id),
    supabase.from('trail_user_badges').select('*').eq('user_id', user.id),
  ])

  const totalPoints = (progress ?? []).reduce((sum, p) => sum + (p.points_earned ?? 0), 0)

  return (
    <TrailHomeClient
      blocks={blocks ?? []}
      sections={sections ?? []}
      progress={progress ?? []}
      badges={badges ?? []}
      totalPoints={totalPoints}
    />
  )
}
