'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'builder'].includes(profile.role)) throw new Error('Sem permissão')
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  return { service }
}

export async function updateUserRole(userId: string, role: string) {
  const { service } = await assertAdmin()
  const { error } = await service
    .from('profiles')
    .update({ role })
    .eq('id', userId)
  if (error) throw new Error('Erro ao atualizar perfil: ' + error.message)
  revalidatePath('/admin/usuarios')
}

export async function updateUserPhone(userId: string, phone: string) {
  const { service } = await assertAdmin()
  const { error } = await service
    .from('profiles')
    .update({ phone: phone.trim() || null })
    .eq('id', userId)
  if (error) throw new Error('Erro ao atualizar telefone: ' + error.message)
  revalidatePath('/admin/usuarios')
}

export async function approveUser(userId: string, role: string) {
  const { service } = await assertAdmin()

  // Buscar dados do usuário a aprovar
  const { data: target } = await service
    .from('profiles')
    .select('id, full_name, email, whatsapp')
    .eq('id', userId)
    .single()

  if (!target) throw new Error('Usuário não encontrado')

  // Ativar usuário com o role escolhido
  const { error } = await service
    .from('profiles')
    .update({ active: true, role, onboarding_complete: true })
    .eq('id', userId)
  if (error) throw new Error('Erro ao aprovar usuário: ' + error.message)

  const displayName = target.full_name || target.email || 'Usuário'
  const userEmail = target.email || ''

  // Notificação in-app para o usuário aprovado
  await service.from('notifications').insert({
    user_id: userId,
    type: 'account_approved',
    title: '✅ Acesso liberado!',
    message: `Seu perfil foi aprovado com sucesso. Você já pode acessar a plataforma.`,
    metadata: { role },
  })

  // Notificações externas em paralelo (não bloqueiam)
  const { sendWhatsApp } = await import('@/lib/whatsapp')
  const { sendEmail, templateAcessoLiberado } = await import('@/lib/email')

  if (target.whatsapp) {
    sendWhatsApp(target.whatsapp, `✅ *Acesso liberado no Bot João!*\n\nOlá, ${displayName}! Seu cadastro foi aprovado.\n\nAcesse agora: https://botjoao.com.br/login`).catch(() => {})
  }
  if (userEmail) {
    sendEmail({ to: userEmail, subject: '✅ Acesso liberado — Bot João', html: templateAcessoLiberado(displayName) }).catch(() => {})
  }

  revalidatePath('/admin/usuarios')
}

export async function rejectUser(userId: string) {
  const { service } = await assertAdmin()
  // Remove o usuário do sistema (hard delete do perfil — Supabase cascade deleta o auth.user)
  // Por segurança, apenas desativa permanentemente sem deletar para manter histórico
  const { error } = await service
    .from('profiles')
    .update({ active: false, onboarding_complete: false })
    .eq('id', userId)
  if (error) throw new Error('Erro ao rejeitar usuário: ' + error.message)
  revalidatePath('/admin/usuarios')
}
