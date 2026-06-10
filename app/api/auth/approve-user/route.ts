/**
 * POST /api/auth/approve-user
 * Admin aprova um usuário pendente, define role, envia notificações.
 */

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { sendWhatsApp } from '@/lib/whatsapp'
import { sendEmail, templateAcessoLiberado } from '@/lib/email'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  // Verificar que quem aprova é admin/builder
  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!me || !['admin', 'builder'].includes(me.role)) {
    return Response.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { userId, role } = await req.json()
  if (!userId || !role) {
    return Response.json({ error: 'userId e role são obrigatórios' }, { status: 400 })
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Buscar dados do usuário aprovado
  const { data: target } = await service
    .from('profiles')
    .select('id, full_name, email, whatsapp')
    .eq('id', userId)
    .single()

  if (!target) return Response.json({ error: 'Usuário não encontrado' }, { status: 404 })

  // Ativar usuário
  const { error: updateErr } = await service
    .from('profiles')
    .update({ active: true, role, onboarding_complete: true })
    .eq('id', userId)

  if (updateErr) {
    logger.error('Erro ao aprovar usuário', { context: 'api/auth/approve-user', error: updateErr })
    return Response.json({ error: 'Erro ao aprovar usuário' }, { status: 500 })
  }

  const displayName = target.full_name || target.email || 'Usuário'
  const userEmail = target.email || ''

  // Notificação in-app para o usuário aprovado
  await service.from('notifications').insert({
    user_id: userId,
    type: 'account_approved',
    title: '✅ Acesso liberado!',
    message: `Seu perfil foi aprovado. Você já pode acessar a plataforma com o perfil: ${role}.`,
    metadata: { role },
  })

  // WhatsApp para o usuário (se tiver número)
  if (target.whatsapp) {
    const msg = `✅ *Acesso liberado no Bot João!*\n\nOlá, ${displayName}! Seu cadastro foi aprovado.\n\nAcesse agora: https://botjoao.com.br/login`
    sendWhatsApp(target.whatsapp, msg).catch(() => {})
  }

  // E-mail para o usuário
  if (userEmail) {
    sendEmail({
      to: userEmail,
      subject: '✅ Acesso liberado — Bot João',
      html: templateAcessoLiberado(displayName),
    }).catch(() => {})
  }

  logger.info('Usuário aprovado', {
    context: 'api/auth/approve-user',
    userId: user.id,
    data: { approvedUserId: userId, role, displayName },
  })

  return Response.json({ ok: true })
}
