/**
 * POST /api/auth/complete-profile
 * Chamada após o usuário (Google ou email) completar o cadastro.
 * Define onboarding_complete = true, active = false.
 * Notifica todos os admins via in-app + WhatsApp + e-mail.
 */

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { sendWhatsApp } from '@/lib/whatsapp'
import { sendEmail, templateCadastroPendente, templateNovoUsuarioAdmin } from '@/lib/email'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  const { full_name, whatsapp, funcao, cidade } = await req.json()

  // Atualiza perfil do usuário: marca onboarding como completo, ativo = false
  const { error: updateErr } = await supabase
    .from('profiles')
    .update({
      full_name: full_name?.trim() || null,
      whatsapp: whatsapp?.trim() || null,
      funcao: funcao?.trim() || null,
      cidade: cidade?.trim() || null,
      onboarding_complete: true,
      active: false,
    })
    .eq('id', user.id)

  if (updateErr) {
    logger.error('Erro ao atualizar perfil no complete-profile', { context: 'api/auth/complete-profile', error: updateErr })
    return Response.json({ error: 'Erro ao salvar perfil' }, { status: 500 })
  }

  const displayName = full_name?.trim() || user.email || 'Usuário'
  const userEmail = user.email || ''

  // Usar service role para notificar admins (RLS não permite consultas cross-user)
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Buscar todos admin/builder
  const { data: admins } = await service
    .from('profiles')
    .select('id, email, whatsapp')
    .in('role', ['admin', 'builder'])
    .eq('active', true)

  // Criar notificação in-app para cada admin
  if (admins && admins.length > 0) {
    const funcaoStr = funcao?.trim() ? ` · ${funcao.trim()}` : ''
    const cidadeStr = cidade?.trim() ? ` · ${cidade.trim()}` : ''
    const notifications = admins.map(a => ({
      user_id: a.id,
      type: 'new_registration',
      title: '🆕 Novo cadastro aguardando aprovação',
      message: `${displayName} (${userEmail})${funcaoStr}${cidadeStr} solicitou acesso à plataforma.`,
      metadata: { newUserId: user.id, newUserEmail: userEmail, newUserName: displayName, funcao: funcao?.trim(), cidade: cidade?.trim() },
    }))

    const { error: notifErr } = await service.from('notifications').insert(notifications)
    if (notifErr) {
      logger.warn('Erro ao criar notificações para admins', { context: 'api/auth/complete-profile', error: notifErr })
    }

    // WhatsApp e e-mail para cada admin
    for (const admin of admins) {
      if (admin.whatsapp) {
        const msg = `🆕 *Novo cadastro pendente no Bot João*\n👤 ${displayName}\n📧 ${userEmail}\n\nAcesse o painel para aprovar:\nhttps://botjoao.com.br/admin/usuarios`
        sendWhatsApp(admin.whatsapp, msg).catch(() => {})
      }
      if (admin.email) {
        sendEmail({
          to: admin.email,
          subject: `🆕 Novo cadastro pendente — ${displayName}`,
          html: templateNovoUsuarioAdmin(displayName, userEmail),
        }).catch(() => {})
      }
    }
  }

  // Notificação WhatsApp para o ADMIN_WHATSAPP genérico (se configurado)
  const adminWa = process.env.ADMIN_WHATSAPP
  if (adminWa) {
    const msg = `🆕 *Novo cadastro pendente no Bot João*\n👤 ${displayName}\n📧 ${userEmail}\n\nAcesse:\nhttps://botjoao.com.br/admin/usuarios`
    sendWhatsApp(adminWa, msg).catch(() => {})
  }

  // E-mail de confirmação para o novo usuário
  sendEmail({
    to: userEmail,
    subject: 'Cadastro recebido — Bot João',
    html: templateCadastroPendente(displayName),
  }).catch(() => {})

  logger.info('Novo cadastro pendente', { context: 'api/auth/complete-profile', userId: user.id, data: { displayName, email: userEmail } })

  return Response.json({ ok: true })
}
