'use server'

import { createClient } from '@/lib/supabase/server'

export async function updateProgress(
  moduleId: string,
  cardsSeen: number,
  completed: boolean
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  await supabase.from('user_progress').upsert(
    {
      user_id: user.id,
      module_id: moduleId,
      cards_seen: cardsSeen,
      completed,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,module_id' }
  )
}
