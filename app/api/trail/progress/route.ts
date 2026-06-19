import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const BADGE_MAP: Record<string, string> = {
  'b0000000-0000-0000-0000-000000000000': 'iniciante',
  'b1000000-0000-0000-0000-000000000001': 'digital',
  'b2000000-0000-0000-0000-000000000002': 'hubmaster',
  'b3000000-0000-0000-0000-000000000003': 'gasexpert',
  'b4000000-0000-0000-0000-000000000004': 'engajador',
  'b5000000-0000-0000-0000-000000000005': 'financeiro',
  'b6000000-0000-0000-0000-000000000006': 'master',
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { sectionId, step, quizScore, quizPassed } = await req.json()
    if (!sectionId || !step) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

    // Busca progresso atual
    const { data: current } = await supabase
      .from('trail_user_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('section_id', sectionId)
      .maybeSingle()

    // Busca info da seção para calcular pontos
    const { data: section } = await supabase
      .from('trail_sections')
      .select('points_value, block_id')
      .eq('id', sectionId)
      .single()

    const updates: Record<string, unknown> = {
      user_id: user.id,
      section_id: sectionId,
      updated_at: new Date().toISOString(),
    }

    // Marca o step como feito
    if (step === 'intro') updates.intro_done = true
    if (step === 'module') updates.module_done = true
    if (step === 'flashcards') updates.flashcards_done = true
    if (step === 'quiz') {
      updates.quiz_score = quizScore
      updates.quiz_passed = quizPassed
      updates.quiz_attempts = (current?.quiz_attempts ?? 0) + 1
      if (quizPassed) {
        updates.completed_at = new Date().toISOString()
        updates.points_earned = (current?.points_earned ?? 0) + (section?.points_value ?? 50)
      }
    }

    // Upsert progresso
    await supabase
      .from('trail_user_progress')
      .upsert({ ...current, ...updates }, { onConflict: 'user_id,section_id' })

    // Verifica badge do bloco se quiz passou
    if (quizPassed && section?.block_id) {
      const badgeKey = BADGE_MAP[section.block_id]
      if (badgeKey) {
        // Verifica se todas as seções do bloco foram concluídas
        const { data: blockSections } = await supabase
          .from('trail_sections')
          .select('id')
          .eq('block_id', section.block_id)

        if (blockSections) {
          const { data: doneProgress } = await supabase
            .from('trail_user_progress')
            .select('section_id')
            .eq('user_id', user.id)
            .eq('quiz_passed', true)
            .in('section_id', blockSections.map(s => s.id))

          const allDone = (doneProgress?.length ?? 0) >= blockSections.length
          if (allDone) {
            await supabase
              .from('trail_user_badges')
              .upsert({ user_id: user.id, badge_key: badgeKey }, { onConflict: 'user_id,badge_key', ignoreDuplicates: true })
          }
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
