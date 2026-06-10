import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsApp } from '@/lib/whatsapp'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { conversationId, question, answer, score } = await req.json()
    const escalated = score < 7

    // Silencioso se tabela não existir ainda
    try {
      await supabase.from('bot_feedback').insert({
        conversation_id: conversationId,
        user_id: user.id,
        question,
        answer,
        score,
        escalated,
        reviewed: false,
      })
    } catch { /* tabela pode não existir ainda */ }

    // Se escalado, notificar gestores e admin via notificação e WhatsApp
    if (escalated) {
      try {
        const service = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Buscar perfil do usuário atual
        const { data: currentProfile } = await service
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle()

        const userName = currentProfile?.full_name ?? 'Consultor'
        const truncatedQuestion = question?.slice(0, 100) ?? ''
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hub.somar.com.br'

        // Buscar todos os gestores/admin/builder ativos (exceto o próprio usuário que escalou)
        const { data: managers } = await service
          .from('profiles')
          .select('id, phone, whatsapp')
          .in('role', ['gerencial', 'admin', 'builder'])
          .eq('active', true)
          .neq('id', user.id)

        if (managers && managers.length > 0) {
          const notifTitle = '🚨 Nova escalação — Bot João'
          const urgency = score <= 3 ? '🔴 URGENTE' : score <= 5 ? '🟠 Médio' : '🟡 Baixo'
          const notifMessage = [
            `🚨 *Bot João — Nova Escalação*`,
            ``,
            `👤 *Consultor:* ${userName}`,
            `📊 *Prioridade:* ${urgency} (nota ${score}/10)`,
            ``,
            `❓ *Pergunta do consultor:*`,
            `_${truncatedQuestion}_`,
            ``,
            `➡️ Acesse o painel para responder:`,
            `${appUrl}/admin/bot?tab=escalations`,
          ].join('\n')

          // Inserir notificações para cada gestor
          const notifInserts = managers.map(m => ({
            user_id: m.id,
            type: 'escalation_new',
            title: notifTitle,
            message: notifMessage,
            metadata: { question: truncatedQuestion, score, userName },
          }))

          await service.from('notifications').insert(notifInserts)

          // Enviar WhatsApp para quem tem phone ou whatsapp
          for (const m of managers) {
            const phone = m.phone ?? m.whatsapp
            if (phone) {
              await sendWhatsApp(phone, notifMessage)
            }
          }
        }
      } catch (e) {
        console.error('Escalation notification error:', e)
        // Não bloqueia a resposta ao usuário
      }
    }

    return NextResponse.json({ ok: true, escalated })
  } catch (err) {
    console.error('Feedback error:', err)
    return NextResponse.json({ error: 'Erro ao salvar feedback' }, { status: 500 })
  }
}
