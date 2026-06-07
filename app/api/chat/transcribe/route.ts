import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const formData = await req.formData()
  const audioFile = formData.get('audio') as File | null
  if (!audioFile) return NextResponse.json({ error: 'Arquivo de áudio não enviado' }, { status: 400 })

  // prompt ensina o Whisper os termos de domínio da Ultragaz
  const whisperPrompt = 'App Ultragaz, Bot João, Vale Gás, AmigU, Ultragaz, canais digitais, entregador, pedido, faturamento, precificação, roteirização, WhatsApp, consultor, módulo, trilha, onboarding'

  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    language: 'pt',
    prompt: whisperPrompt,
  })

  return NextResponse.json({ text: transcription.text })
}
