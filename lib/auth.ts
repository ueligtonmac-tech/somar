/**
 * Helpers de autorização reutilizáveis para Server Actions e API Routes.
 */

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const ADMIN_ROLES = ['admin', 'builder'] as const
export type AdminRole = typeof ADMIN_ROLES[number]

/**
 * Verifica se o usuário autenticado é admin ou builder.
 * Usa service role para checar o perfil (bypass RLS — evita falsos "Sem permissão").
 * Retorna { supabase, service, userId } ou lança erro com mensagem legível.
 */
export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Não autenticado')

  // Service client para verificar role sem depender de RLS
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !(ADMIN_ROLES as readonly string[]).includes(profile.role ?? '')) {
    throw new Error('Sem permissão')
  }

  return { supabase, service, userId: user.id, role: profile.role as AdminRole }
}

/**
 * Escapa caracteres HTML para uso seguro em templates de e-mail.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
