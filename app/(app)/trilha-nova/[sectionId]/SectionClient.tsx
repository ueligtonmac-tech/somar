'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'intro' | 'module' | 'flashcards' | 'quiz' | 'done'

interface Flashcard { id: string; front: string; back: string }
interface QuizQuestion { id: string; question: string; options: string[]; correct_index: number; explanation: string }
interface LibraryFile { id: string; title: string; file_url: string }
interface ModuleCard { title: string; scenario: string; challenge: string; explanation: string; action_hint?: string }
interface Progress { intro_done: boolean; module_done: boolean; flashcards_done: boolean; quiz_passed: boolean; quiz_score: number | null; points_earned: number }

interface Props {
  section: { id: string; title: string; intro_title: string | null; intro_text: string | null; points_value: number; trail_blocks: { color: string; icon: string; title: string } }
  flashcards: Flashcard[]
  quizQuestions: QuizQuestion[]
  progress: Progress | null
  libraryFiles: LibraryFile[]
  moduleCards: ModuleCard[]
  userId: string
}

export default function SectionClient({ section, flashcards, quizQuestions, progress, libraryFiles, moduleCards, userId }: Props) {
  const router = useRouter()
  const color = section.trail_blocks?.color ?? '#000FFF'

  // Determina passo inicial baseado no progresso existente
  const initialStep: Step = (() => {
    if (!progress) return 'intro'
    if (!progress.intro_done) return 'intro'
    if (!progress.module_done) return 'module'
    if (!progress.flashcards_done) return 'flashcards'
    if (!progress.quiz_passed) return 'quiz'
    return 'done'
  })()

  const [step, setStep] = useState<Step>(initialStep)
  const [saving, setSaving] = useState(false)

  // ── Flashcards state ──
  const [cardIndex, setCardIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  // ── Quiz state ──
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>(quizQuestions.map(() => null))
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizScore, setQuizScore] = useState<number | null>(null)

  const STEPS: Step[] = ['intro', 'module', 'flashcards', 'quiz']
  const stepIndex = STEPS.indexOf(step)
  const stepPct = step === 'done' ? 100 : Math.round(((stepIndex) / STEPS.length) * 100)

  async function markStep(completedStep: Step, extra: Record<string, unknown> = {}) {
    setSaving(true)
    try {
      await fetch('/api/trail/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId: section.id, step: completedStep, ...extra }),
      })
    } finally {
      setSaving(false)
    }
  }

  async function goNext() {
    const order: Step[] = ['intro', 'module', 'flashcards', 'quiz', 'done']
    const next = order[order.indexOf(step) + 1]
    await markStep(step)
    setStep(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submitQuiz() {
    const correct = quizAnswers.filter((a, i) => a === quizQuestions[i]?.correct_index).length
    const score = Math.round((correct / quizQuestions.length) * 100)
    setQuizScore(score)
    setQuizSubmitted(true)
    const passed = score >= 60
    await markStep('quiz', { quizScore: score, quizPassed: passed })
    if (passed) setStep('done')
  }

  // ────────────────────────────────────────
  // STEP: INTRO
  // ────────────────────────────────────────
  if (step === 'intro') return (
    <Layout section={section} color={color} stepPct={stepPct} step={step}>
      <div className="space-y-4">
        {/* Material da biblioteca */}
        {libraryFiles.length > 0 && (
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-2">📚 Material de apoio</p>
            <div className="space-y-2">
              {libraryFiles.map(f => (
                <a key={f.id} href={f.file_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-700 font-medium hover:underline">
                  <span>📄</span> {f.title}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Introdução */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-black text-gray-900 mb-3">{section.intro_title ?? section.title}</h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{section.intro_text}</p>
        </div>

        <button onClick={goNext} disabled={saving}
          className="w-full py-4 rounded-2xl text-white font-black text-base transition-opacity disabled:opacity-50"
          style={{ background: color }}>
          {saving ? 'Salvando...' : 'Entendi — avançar para o módulo →'}
        </button>
      </div>
    </Layout>
  )

  // ────────────────────────────────────────
  // STEP: MÓDULO EXPANDIDO
  // ────────────────────────────────────────
  if (step === 'module') return (
    <Layout section={section} color={color} stepPct={stepPct} step={step}>
      <div className="space-y-4">
        {moduleCards.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 text-center text-gray-400">
            <p className="text-4xl mb-2">🧩</p>
            <p className="text-sm">Módulo expandido em breve!</p>
          </div>
        ) : moduleCards.map((card, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 text-white text-sm font-bold" style={{ background: color }}>
              Cenário {i + 1} — {card.title}
            </div>
            <div className="p-5 space-y-4">
              {card.scenario && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Situação</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{card.scenario}</p>
                </div>
              )}
              {card.challenge && (
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1">🎯 Desafio</p>
                  <p className="text-sm text-amber-900 leading-relaxed">{card.challenge}</p>
                </div>
              )}
              {card.explanation && (
                <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                  <p className="text-xs font-bold text-green-700 uppercase tracking-widest mb-1">✅ Resposta</p>
                  <p className="text-sm text-green-900 leading-relaxed">{card.explanation}</p>
                </div>
              )}
            </div>
          </div>
        ))}

        <button onClick={goNext} disabled={saving}
          className="w-full py-4 rounded-2xl text-white font-black text-base transition-opacity disabled:opacity-50"
          style={{ background: color }}>
          {saving ? 'Salvando...' : 'Ótimo — partir para os flashcards 📇'}
        </button>
      </div>
    </Layout>
  )

  // ────────────────────────────────────────
  // STEP: FLASHCARDS
  // ────────────────────────────────────────
  if (step === 'flashcards') {
    const card = flashcards[cardIndex]
    const isLast = cardIndex === flashcards.length - 1

    return (
      <Layout section={section} color={color} stepPct={stepPct} step={step}>
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>Card {cardIndex + 1} de {flashcards.length}</span>
            <span className="font-bold" style={{ color }}>{Math.round(((cardIndex + 1) / flashcards.length) * 100)}%</span>
          </div>

          {/* Card com flip */}
          <div className="relative h-52 cursor-pointer" onClick={() => setFlipped(f => !f)}
            style={{ perspective: '1000px' }}>
            <div className={`relative w-full h-full transition-transform duration-500`}
              style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
              {/* Frente */}
              <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-6 text-center shadow-md"
                style={{ backfaceVisibility: 'hidden', background: color }}>
                <p className="text-xs text-white/70 font-bold uppercase tracking-widest mb-3">Pergunta</p>
                <p className="text-white font-black text-lg leading-snug">{card?.front}</p>
                <p className="text-white/60 text-xs mt-4">Toque para revelar ↩</p>
              </div>
              {/* Verso */}
              <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-6 text-center bg-white border-2 shadow-md"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderColor: color }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color }}>Resposta</p>
                <p className="text-gray-800 font-semibold text-base leading-relaxed">{card?.back}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button disabled={cardIndex === 0}
              onClick={() => { setCardIndex(i => i - 1); setFlipped(false) }}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 disabled:opacity-30">
              ← Anterior
            </button>
            {isLast ? (
              <button onClick={async () => { await goNext() }}
                disabled={saving}
                className="flex-1 py-3 rounded-xl text-white font-black text-sm disabled:opacity-50"
                style={{ background: color }}>
                {saving ? '...' : 'Quiz! →'}
              </button>
            ) : (
              <button onClick={() => { setCardIndex(i => i + 1); setFlipped(false) }}
                className="flex-1 py-3 rounded-xl text-white font-black text-sm"
                style={{ background: color }}>
                Próximo →
              </button>
            )}
          </div>
        </div>
      </Layout>
    )
  }

  // ────────────────────────────────────────
  // STEP: QUIZ
  // ────────────────────────────────────────
  if (step === 'quiz') return (
    <Layout section={section} color={color} stepPct={stepPct} step={step}>
      <div className="space-y-5">
        {!quizSubmitted ? (
          <>
            <p className="text-sm text-gray-500 text-center">Responda todas as questões para finalizar a seção. Mínimo 60% para avançar.</p>
            {quizQuestions.map((q, qi) => (
              <div key={q.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
                <p className="text-sm font-bold text-gray-900">{qi + 1}. {q.question}</p>
                {q.options.map((opt, oi) => (
                  <button key={oi} onClick={() => {
                    const next = [...quizAnswers]
                    next[qi] = oi
                    setQuizAnswers(next)
                  }}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all
                      ${quizAnswers[qi] === oi
                        ? 'border-[#000FFF] bg-blue-50 font-bold text-[#000FFF]'
                        : 'border-gray-100 text-gray-700 hover:bg-gray-50'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            ))}
            <button
              onClick={submitQuiz}
              disabled={quizAnswers.some(a => a === null) || saving}
              className="w-full py-4 rounded-2xl text-white font-black text-base disabled:opacity-40"
              style={{ background: color }}>
              {saving ? 'Calculando...' : 'Enviar respostas ✓'}
            </button>
          </>
        ) : (
          <div className="space-y-4">
            {/* Resultado */}
            <div className={`rounded-2xl p-6 text-center ${quizScore! >= 60 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className="text-5xl font-black mb-1" style={{ color: quizScore! >= 60 ? '#16a34a' : '#dc2626' }}>{quizScore}%</p>
              <p className="font-bold text-lg">{quizScore! >= 60 ? '🎉 Aprovado!' : '😬 Tente novamente'}</p>
              <p className="text-sm text-gray-500 mt-1">
                {quizScore! >= 60 ? `+${section.points_value} pontos ganhos!` : 'Você precisa de pelo menos 60% para avançar.'}
              </p>
            </div>

            {/* Gabarito */}
            <div className="space-y-3">
              {quizQuestions.map((q, qi) => {
                const chosen = quizAnswers[qi]
                const correct = q.correct_index
                const isRight = chosen === correct
                return (
                  <div key={q.id} className={`rounded-xl p-4 border text-sm ${isRight ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <p className="font-bold text-gray-800 mb-1">{qi + 1}. {q.question}</p>
                    <p className={`text-xs font-bold ${isRight ? 'text-green-700' : 'text-red-700'}`}>
                      {isRight ? '✅' : '❌'} Sua resposta: {chosen !== null ? q.options[chosen] : '—'}
                    </p>
                    {!isRight && <p className="text-xs text-green-700 mt-1">✅ Correto: {q.options[correct]}</p>}
                    {q.explanation && <p className="text-xs text-gray-500 mt-2 italic">{q.explanation}</p>}
                  </div>
                )
              })}
            </div>

            {quizScore! >= 60 ? (
              <button onClick={() => router.push('/trilha-nova')}
                className="w-full py-4 rounded-2xl text-white font-black text-base"
                style={{ background: color }}>
                Continuar trilha 🚀
              </button>
            ) : (
              <button onClick={() => {
                setQuizAnswers(quizQuestions.map(() => null))
                setQuizSubmitted(false)
                setQuizScore(null)
              }}
                className="w-full py-4 rounded-2xl border-2 font-black text-base"
                style={{ borderColor: color, color }}>
                Tentar novamente
              </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  )

  // ────────────────────────────────────────
  // STEP: DONE
  // ────────────────────────────────────────
  return (
    <Layout section={section} color={color} stepPct={100} step="done">
      <div className="text-center space-y-6 py-8">
        <div className="text-7xl">🏅</div>
        <div>
          <h2 className="text-2xl font-black text-gray-900">Seção concluída!</h2>
          <p className="text-gray-500 mt-1">+{section.points_value} pontos adicionados</p>
        </div>
        <button onClick={() => router.push('/trilha-nova')}
          className="w-full py-4 rounded-2xl text-white font-black text-base"
          style={{ background: color }}>
          Voltar à trilha 🚀
        </button>
      </div>
    </Layout>
  )
}

// ── Layout wrapper ──────────────────────────
const STEP_LABELS: Record<string, string> = {
  intro: '1 Introdução',
  module: '2 Módulo',
  flashcards: '3 Flashcards',
  quiz: '4 Quiz',
  done: '✓ Concluída',
}

function Layout({ section, color, stepPct, step, children }: {
  section: Props['section']; color: string; stepPct: number; step: Step; children: React.ReactNode
}) {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="text-white px-4 pt-6 pb-5" style={{ background: color }}>
        <button onClick={() => router.push('/trilha-nova')} className="text-white/70 text-sm mb-3 flex items-center gap-1">
          ← Trilha
        </button>
        <p className="text-xs opacity-70 font-bold uppercase tracking-widest">{section.trail_blocks?.title}</p>
        <h1 className="text-xl font-black mt-0.5">{section.title}</h1>

        {/* Steps */}
        <div className="flex gap-2 mt-4">
          {(['intro', 'module', 'flashcards', 'quiz'] as Step[]).map(s => (
            <div key={s} className={`flex-1 text-center text-[10px] font-bold py-1 rounded-full transition-all
              ${s === step ? 'bg-white text-gray-900' : stepPct >= 100 ? 'bg-white/40 text-white' : 'bg-white/20 text-white/60'}`}>
              {STEP_LABELS[s]}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pt-5">{children}</div>
    </div>
  )
}
