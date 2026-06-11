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

// Tamanhos máximos aceitáveis para campos de texto
const MAX_NAME = 120
const MAX_WHATSAPP = 20
const MAX_FUNCAO = 60
const MAX_CIDADE = 80
const MAX_REGIAO = 60

function sanitize(value: unknown, maxLen: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().slice(0, maxLen)
  return trimmed || null
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  // Idempotência: se já completou o onboarding, não deixa re-submeter e resetar active
  const { data: existing } = await supabase
    .from('profiles')
    .select('onboarding_complete, active')
    .eq('id', user.id)
    .single()

  if (existing?.onboarding_complete) {
    return Response.json({ error: 'Perfil já cadastrado.' }, { status: 409 })
  }

  // Parse e validação do body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  const raw = body as Record<string, unknown>
  const full_name = sanitize(raw.full_name, MAX_NAME)
  const whatsapp = sanitize(raw.whatsapp, MAX_WHATSAPP)
  const funcao = sanitize(raw.funcao, MAX_FUNCAO)
  const cidade = sanitize(raw.cidade, MAX_CIDADE)
  const regiao = sanitize(raw.regiao, MAX_REGIAO)

  if (!full_name) return Response.json({ error: 'Nome completo é obrigatório.' }, { status: 400 })
  if (!funcao)    return Response.json({ error: 'Função é obrigatória.' }, { status: 400 })
  if (!cidade)    return Response.json({ error: 'Cidade é obrigatória.' }, { status: 400 })
  if (!regiao)    return Response.json({ error: 'Região é obrigatória.' }, { status: 400 })

  // Atualiza perfil
  const { error: updateErr } = await supabase
    .from('profiles')
    .update({
      full_name,
      whatsapp,
      funcao,
      cidade,
      regiao,
      onboarding_complete: true,
      active: false,
    })
    .eq('id', user.id)

  if (updateErr) {
    logger.error('Erro ao atualizar perfil no complete-profile', { context: 'api/auth/complete-profile', error: updateErr })
    return Response.json({ error: 'Erro ao salvar perfil' }, { status: 500 })
  }

  const displayName = full_name || user.email || 'Usuário'
  const userEmail = user.email || ''

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Buscar todos admin/builder ativos
  const { data: admins } = await service
    .from('profiles')
    .select('id, email, whatsapp')
    .in('role', ['admin', 'builder'])
    .eq('active', true)

  if (admins && admins.length > 0) {
    const funcaoStr = funcao ? ` · ${funcao}` : ''
    const cidadeStr = cidade ? ` · ${cidade}` : ''

    const notifications = admins.map(a => ({
      user_id: a.id,
      type: 'new_registration',
      title: '🆕 Novo cadastro aguardando aprovação',
      message: `${displayName} (${userEmail})${funcaoStr}${cidadeStr} solicitou acesso à plataforma.`,
      metadata: { newUserId: user.id, newUserEmail: userEmail, newUserName: displayName, funcao, cidade, regiao },
    }))

    const { error: notifErr } = await service.from('notifications').insert(notifications)
    if (notifErr) {
      logger.warn('Erro ao criar notificações para admins', { context: 'api/auth/complete-profile', error: notifErr })
    }

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

  // WhatsApp genérico do admin
  const adminWa = process.env.ADMIN_WHATSAPP
  if (adminWa) {
    sendWhatsApp(adminWa, `🆕 *Novo cadastro pendente no Bot João*\n👤 ${displayName}\n📧 ${userEmail}\n\nAcesse:\nhttps://botjoao.com.br/admin/usuarios`).catch(() => {})
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
