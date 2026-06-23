import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json()

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Nome e e-mail são obrigatórios.' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const trialExpiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()

    // Verificar se e-mail já tem conta trial
    const { data: existing } = await adminClient
      .from('profiles')
      .select('id, role, trial_expires_at, active, onboarding_complete')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (existing) {
      // Atualiza para trial se: não está ativo, já é trial, ou onboarding incompleto
      // Não rebaixa quem já tem conta completa (active + onboarding_complete)
      const isFullAccount = existing.active && existing.onboarding_complete && existing.role !== 'consultor_trial'
      if (!isFullAccount) {
        await adminClient.from('profiles').update({
          role: 'consultor_trial',
          active: true,
          onboarding_complete: true,
          trial_expires_at: trialExpiresAt,
        }).eq('email', normalizedEmail)
      }
      // Gera magic link direto
      const origin = req.nextUrl.origin
      const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
        type: 'magiclink',
        email: normalizedEmail,
        options: { redirectTo: `${origin}/auth/magic` },
      })
      if (linkErr || !linkData) {
        return NextResponse.json({ error: 'Erro ao gerar link de acesso.' }, { status: 500 })
      }
      return NextResponse.json({ actionLink: linkData.properties.action_link })
    }

    // Criar novo usuário trial
    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      email_confirm: true,
      user_metadata: { full_name: name.trim() },
    })

    if (createErr || !newUser?.user) {
      return NextResponse.json({ error: 'Erro ao criar acesso.' }, { status: 500 })
    }

    // Criar perfil
    await adminClient.from('profiles').upsert({
      id: newUser.user.id,
      full_name: name.trim(),
      email: normalizedEmail,
      role: 'consultor_trial',
      active: true,
      onboarding_complete: true,
      trial_expires_at: trialExpiresAt,
    })

    // Gerar magic link para login automático
    const origin = req.nextUrl.origin
    const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: normalizedEmail,
      options: { redirectTo: `${origin}/auth/magic` },
    })

    if (linkErr || !linkData) {
      return NextResponse.json({ error: 'Conta criada, mas erro ao gerar link de acesso.' }, { status: 500 })
    }

    return NextResponse.json({ actionLink: linkData.properties.action_link })
  } catch (err) {
    console.error('[trial/create]', err)
    return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 })
  }
}
