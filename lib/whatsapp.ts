/**
 * Envio de mensagens WhatsApp via Z-API (https://z-api.io)
 * Requer ZAPI_INSTANCE_ID e ZAPI_TOKEN nas variáveis de ambiente.
 */

import { logger } from './logger'

export async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  const instanceId = process.env.ZAPI_INSTANCE_ID
  const token = process.env.ZAPI_TOKEN

  if (!instanceId || !token) {
    logger.warn('WhatsApp não enviado: ZAPI_INSTANCE_ID ou ZAPI_TOKEN não configurados', {
      context: 'whatsapp',
      data: { phone: phone.slice(0, 4) + '***' },
    })
    return false
  }

  // Normaliza número: remove não-dígitos e garante prefixo 55 (Brasil)
  const normalized = phone.replace(/\D/g, '')
  const withCountry = normalized.startsWith('55') ? normalized : `55${normalized}`

  if (withCountry.length < 12) {
    logger.warn('WhatsApp não enviado: número inválido', {
      context: 'whatsapp',
      data: { phone: phone.slice(0, 4) + '***' },
    })
    return false
  }

  try {
    const res = await fetch(
      `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: withCountry, message }),
      }
    )

    if (!res.ok) {
      const body = await res.text()
      logger.error('Falha ao enviar WhatsApp via Z-API', {
        context: 'whatsapp',
        data: { status: res.status, body: body.slice(0, 200) },
      })
      return false
    }

    logger.info('WhatsApp enviado', {
      context: 'whatsapp',
      data: { phone: withCountry.slice(0, 6) + '***' },
    })
    return true
  } catch (err) {
    logger.error('Erro de rede ao enviar WhatsApp', { context: 'whatsapp', error: err })
    return false
  }
}
