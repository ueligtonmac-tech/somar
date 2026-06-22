'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'

export async function updateUserRole(userId: string, role: string) {
  const { service } = await requireAdmin()
  const { error } = await service
    .from('profiles')
    .update({ role })
    .eq('id', userId)
  if (error) throw new Error('Erro ao atualizar perfil: ' + error.message)
  revalidatePath('/admin/usuarios')
}

export async function updateUserPhone(userId: string, phone: string) {
  const { service } = await requireAdmin()
  const { error } = await service
    .from('profiles')
    .update({ phone: phone.trim() || null })
    .eq('id', userId)
  if (error) throw new Error('Erro ao atualizar telefone: ' + error.message)
  revalidatePath('/admin/usuarios')
}

export async function approveUser(userId: string, role: string, perfil?: string) {
  const { service } = await requireAdmin()

  const { data: target } = await service
    .from('profiles')
    .select('id, full_name, email, whatsapp')
    .eq('id', userId)
    .single()

  if (!target) throw new Error('Usuário não encontrado')

  const updateData: Record<string, unknown> = { active: true, role, onboarding_complete: true }
  if (perfil) updateData.perfil = perfil

  const { error } = await service
    .from('profiles')
    .update(updateData)
    .eq('id', userId)
  if (error) throw new Error('Erro ao aprovar usuário: ' + error.message)

  const displayName = target.full_name || target.email || 'Usuário'
  const userEmail = target.email || ''

  await service.from('notifications').insert({
    user_id: userId,
    type: 'account_approved',
    title: '✅ Acesso liberado!',
    message: 'Seu perfil foi aprovado com sucesso. Você já pode acessar a plataforma.',
    metadata: { role, perfil: perfil ?? null },
  })

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

export async function forceApproveUser(userId: string) {
  const { service } = await requireAdmin()

  const { data: target } = await service
    .from('profiles')
    .select('full_name, email, whatsapp')
    .eq('id', userId)
    .single()

  if (!target) throw new Error('Usuário não encontrado')

  const { error } = await service
    .from('profiles')
    .update({ active: true, onboarding_complete: true, rejected_at: null })
    .eq('id', userId)

  if (error) throw new Error('Erro ao liberar acesso: ' + error.message)

  const displayName = target.full_name || target.email || 'Usuário'
  const userEmail = target.email || ''

  await service.from('notifications').insert({
    user_id: userId,
    type: 'account_approved',
    title: '✅ Acesso liberado!',
    message: 'Seu acesso foi liberado. Complete seu perfil ao entrar na plataforma.',
    metadata: {},
  })

  const { sendEmail, templateAcessoLiberado } = await import('@/lib/email')
  if (userEmail) {
    sendEmail({ to: userEmail, subject: '✅ Acesso liberado — Bot João', html: templateAcessoLiberado(displayName) }).catch(() => {})
  }

  revalidatePath('/admin/usuarios')
}

export async function resendAccessEmail(userId: string) {
  const { service } = await requireAdmin()

  const { data: target } = await service
    .from('profiles')
    .select('full_name, email, active')
    .eq('id', userId)
    .single()

  if (!target) throw new Error('Usuário não encontrado')
  if (!target.email) throw new Error('Usuário sem e-mail cadastrado')

  const displayName = target.full_name || target.email
  const { sendEmail, templateAcessoLiberado } = await import('@/lib/email')

  await sendEmail({
    to: target.email,
    subject: '✅ Acesso liberado — Bot João',
    html: templateAcessoLiberado(displayName),
  })
}

export async function rejectUser(userId: string) {
  const { service } = await requireAdmin()

  // Buscar dados para notificação antes de rejeitar
  const { data: target } = await service
    .from('profiles')
    .select('full_name, email')
    .eq('id', userId)
    .single()

  if (!target) throw new Error('Usuário não encontrado')

  // Marca como rejeitado: active=false, onboarding_complete=false, role permanece
  // A coluna rejected_at sinaliza que foi deliberadamente rejeitado (evita re-aprovação acidental)
  const { error } = await service
    .from('profiles')
    .update({ active: false, onboarding_complete: false, rejected_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) {
    // Se rejected_at não existir ainda (antes da migration), fazer sem ela
    const { error: err2 } = await service
      .from('profiles')
      .update({ active: false, onboarding_complete: false })
      .eq('id', userId)
    if (err2) throw new Error('Erro ao rejeitar usuário: ' + err2.message)
  }

  // Notificação in-app para o usuário rejeitado
  await service.from('notifications').insert({
    user_id: userId,
    type: 'account_rejected',
    title: '❌ Cadastro não aprovado',
    message: 'Seu cadastro não foi aprovado neste momento. Entre em contato com o administrador para mais informações.',
    metadata: {},
  })

  revalidatePath('/admin/usuarios')
}
