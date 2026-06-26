import { NextResponse } from 'next/server'

/**
 * Endpoint de chat público — acesso restrito.
 * O frontend da landing page agora exibe uma resposta local sem chamar esta rota.
 * Esta rota existe como fallback e retorna uma mensagem de acesso restrito.
 */
export async function POST() {
  const msg = 'Será uma satisfação te ajudar! Sou o Bot João, assistente oficial dos consultores Ultragaz. O acesso à plataforma é restrito e será liberado pelos administradores. Faça seu login ou aguarde a aprovação do seu cadastro. 🔐'

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(msg))
      controller.close()
    },
  })

  return new NextResponse(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
