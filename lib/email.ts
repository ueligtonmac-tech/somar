/**
 * Envio de e-mails transacionais via Resend (https://resend.com)
 * Requer variável de ambiente RESEND_API_KEY no Vercel.
 * Se a chave não estiver configurada, a função falha silenciosamente.
 */

import { logger } from './logger'

const FROM = 'Bot João <noreply@botjoao.com.br>'

interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    logger.warn('RESEND_API_KEY não configurada — e-mail não enviado', { context: 'email' })
    return false
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    })

    if (!res.ok) {
      const body = await res.text()
      logger.error('Falha ao enviar e-mail', { context: 'email', data: { status: res.status, body } })
      return false
    }

    return true
  } catch (err) {
    logger.error('Erro ao chamar API do Resend', { context: 'email', error: err })
    return false
  }
}

// ── Templates ──────────────────────────────────────────────────────────────────

export function templateCadastroPendente(nome: string): string {
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px;">
      <img src="https://botjoao.com.br/logo.png" alt="Ultragaz" width="140" style="margin-bottom: 32px;" />
      <h1 style="color: #111; font-size: 24px; font-weight: 900; margin-bottom: 8px;">Cadastro recebido! 🎉</h1>
      <p style="color: #6b7280; font-size: 15px; line-height: 1.6;">
        Olá, <strong style="color: #111;">${nome}</strong>!<br /><br />
        Seu cadastro no <strong style="color: #000FFF;">Bot João</strong> foi registrado com sucesso.<br />
        Nossa equipe irá analisar seu perfil e você receberá um e-mail assim que o acesso for liberado.
      </p>
      <div style="margin: 32px 0; padding: 20px; background: #f8f9fa; border-radius: 12px; border-left: 4px solid #000FFF;">
        <p style="margin: 0; color: #374151; font-size: 14px; font-weight: 600;">⏳ Aguardando aprovação</p>
        <p style="margin: 4px 0 0; color: #9ca3af; font-size: 13px;">Tempo médio de análise: até 1 dia útil</p>
      </div>
      <p style="color: #9ca3af; font-size: 12px;">© 2026 Arkanjia — Bot João · Ultragaz</p>
    </div>
  `
}

export function templateAcessoLiberado(nome: string): string {
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px;">
      <img src="https://botjoao.com.br/logo.png" alt="Ultragaz" width="140" style="margin-bottom: 32px;" />
      <h1 style="color: #111; font-size: 24px; font-weight: 900; margin-bottom: 8px;">Acesso liberado! ✅</h1>
      <p style="color: #6b7280; font-size: 15px; line-height: 1.6;">
        Olá, <strong style="color: #111;">${nome}</strong>!<br /><br />
        Seu perfil no <strong style="color: #000FFF;">Bot João</strong> foi aprovado.<br />
        Você já pode acessar a plataforma e começar a trilha de aprendizado.
      </p>
      <a href="https://botjoao.com.br/login"
         style="display: inline-block; margin: 24px 0; padding: 14px 32px; background: #000FFF; color: white; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 15px;">
        Acessar o Bot João →
      </a>
      <p style="color: #9ca3af; font-size: 12px;">© 2026 Arkanjia — Bot João · Ultragaz</p>
    </div>
  `
}

export function templateNovoUsuarioAdmin(nome: string, email: string): string {
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px;">
      <img src="https://botjoao.com.br/logo.png" alt="Ultragaz" width="140" style="margin-bottom: 32px;" />
      <h1 style="color: #111; font-size: 22px; font-weight: 900; margin-bottom: 8px;">🆕 Novo cadastro pendente</h1>
      <p style="color: #6b7280; font-size: 15px; line-height: 1.6;">
        Um novo usuário aguarda aprovação no <strong style="color: #000FFF;">Bot João</strong>:
      </p>
      <div style="margin: 20px 0; padding: 16px 20px; background: #f8f9fa; border-radius: 12px;">
        <p style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #111;">${nome}</p>
        <p style="margin: 0; font-size: 13px; color: #6b7280;">${email}</p>
      </div>
      <a href="https://botjoao.com.br/admin/usuarios"
         style="display: inline-block; margin: 16px 0; padding: 12px 28px; background: #000FFF; color: white; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px;">
        Aprovar no painel →
      </a>
      <p style="color: #9ca3af; font-size: 12px;">© 2026 Arkanjia — Bot João · Ultragaz</p>
    </div>
  `
}
