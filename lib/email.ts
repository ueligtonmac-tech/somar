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
  const primeiroNome = nome.split(' ')[0]
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:580px;margin:40px auto;padding:0 16px 40px;">

    <!-- Header -->
    <div style="background:#000FFF;border-radius:20px 20px 0 0;padding:32px 40px;text-align:center;">
      <img src="https://botjoao.com.br/logo-white.png" alt="Ultragaz" width="130" style="height:auto;" onerror="this.style.display='none'" />
      <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:12px 0 0;letter-spacing:0.5px;">BOT JOÃO · HUB SOMAR</p>
    </div>

    <!-- Body -->
    <div style="background:white;padding:40px;border-radius:0 0 20px 20px;box-shadow:0 8px 40px rgba(0,15,255,0.08);">

      <!-- Ícone de sucesso -->
      <div style="width:64px;height:64px;background:#f0fdf4;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;border:2px solid #bbf7d0;">
        <span style="font-size:28px;">✅</span>
      </div>

      <h1 style="color:#111;font-size:26px;font-weight:900;margin:0 0 8px;text-align:center;">
        Acesso liberado, ${primeiroNome}!
      </h1>
      <p style="color:#6b7280;font-size:15px;line-height:1.7;text-align:center;margin:0 0 32px;">
        Seu cadastro foi aprovado e você já pode acessar<br/>a plataforma <strong style="color:#000FFF;">Bot João</strong>.
      </p>

      <!-- CTA principal -->
      <div style="text-align:center;margin-bottom:36px;">
        <a href="https://botjoao.com.br/login"
           style="display:inline-block;padding:16px 40px;background:#000FFF;color:white;text-decoration:none;border-radius:14px;font-weight:800;font-size:16px;letter-spacing:0.3px;">
          Acessar o Bot João →
        </a>
        <p style="color:#9ca3af;font-size:12px;margin:12px 0 0;">
          <a href="https://botjoao.com.br/login" style="color:#000FFF;">botjoao.com.br/login</a>
        </p>
      </div>

      <!-- Divider -->
      <div style="border-top:1px solid #f3f4f6;margin-bottom:28px;"></div>

      <!-- O que você encontra -->
      <p style="font-size:13px;font-weight:700;color:#374151;margin:0 0 16px;">O que você encontra na plataforma:</p>
      <div style="display:grid;gap:12px;">
        ${[
          ['📚', 'Trilha de aprendizado', 'Conteúdos sobre canais digitais e operação Ultragaz'],
          ['🤖', 'Bot João', 'Tire dúvidas sobre pedidos, gestão e processos'],
          ['📊', 'Materiais e recursos', 'Biblioteca com guias, vídeos e referências'],
        ].map(([icon, title, desc]) => `
        <div style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px;background:#f8f9fa;border-radius:12px;">
          <span style="font-size:18px;flex-shrink:0;">${icon}</span>
          <div>
            <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:#111;">${title}</p>
            <p style="margin:0;font-size:12px;color:#6b7280;">${desc}</p>
          </div>
        </div>`).join('')}
      </div>

      <!-- Ajuda -->
      <div style="margin-top:28px;padding:16px 20px;background:#fffbeb;border-radius:12px;border:1px solid #fef3c7;">
        <p style="margin:0;font-size:13px;color:#92400e;">
          💬 Dúvidas? Fale com o administrador pelo
          <a href="https://wa.me/5565996464417" style="color:#000FFF;font-weight:700;text-decoration:none;"> WhatsApp</a>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <p style="text-align:center;color:#9ca3af;font-size:11px;margin-top:24px;">
      © 2026 Arkanjia · Bot João · Ultragaz<br/>
      Este e-mail foi enviado para ${nome} · <a href="https://botjoao.com.br" style="color:#9ca3af;">botjoao.com.br</a>
    </p>
  </div>
</body>
</html>`
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
