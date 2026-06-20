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
  section: { id: string; title: string; intro_title: string | null; intro_text: string | null; points_value: number; video_url?: string | null; trail_blocks: { color: string; icon: string; title: string } }
  flashcards: Flashcard[]
  quizQuestions: QuizQuestion[]
  progress: Progress | null
  libraryFiles: LibraryFile[]
  moduleCards: ModuleCard[]
  userId: string
}

function getEmbedUrl(url: string) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vm = url.match(/vimeo\.com\/(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`
  return url
}

export default function SectionClient({ section, flashcards, quizQuestions, progress, libraryFiles, moduleCards }: Props) {
  const router = useRouter()
  const color = section.trail_blocks?.color ?? '#000FFF'

  // Steps disponíveis: pular flashcards e quiz se vazios (excluindo 'done' que é estado terminal)
  type ContentStep = 'intro' | 'module' | 'flashcards' | 'quiz'
  const ALL_CONTENT_STEPS: ContentStep[] = ['intro', 'module', 'flashcards', 'quiz']
  const availableSteps: ContentStep[] = ALL_CONTENT_STEPS.filter(s => {
    if (s === 'flashcards') return flashcards.length > 0
    if (s === 'quiz') return quizQuestions.length > 0
    return true
  })

  // Determina passo inicial baseado no progresso existente
  const initialStep: Step = (() => {
    if (!progress) return 'intro'
    if (!progress.intro_done) return 'intro'
    if (!progress.module_done) return availableSteps.includes('module') ? 'module' : (availableSteps[availableSteps.indexOf('intro') + 1] ?? 'done')
    if (!progress.flashcards_done && flashcards.length > 0) return 'flashcards'
    if (!progress.quiz_passed && quizQuestions.length > 0) return 'quiz'
    return 'done'
  })()

  function getNextAvailable(current: Step): Step {
    if (current === 'done') return 'done'
    const idx = availableSteps.indexOf(current as ContentStep)
    return availableSteps[idx + 1] ?? 'done'
  }

  const [step, setStep] = useState<Step>(initialStep)
  const [saving, setSaving] = useState(false)

  // ── Flashcards state ──
  const [cardIndex, setCardIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  // ── Quiz state ──
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>(quizQuestions.map(() => null))
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizScore, setQuizScore] = useState<number | null>(null)

  // visibleSteps são os steps de conteúdo disponíveis (sem 'done')
  const visibleSteps = availableSteps
  const stepIndex = step !== 'done' ? visibleSteps.indexOf(step) : -1
  const stepPct = step === 'done' ? 100 : stepIndex >= 0 ? Math.round((stepIndex / visibleSteps.length) * 100) : 0

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
    await markStep(step)
    const next = getNextAvailable(step)
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
    <Layout section={section} color={color} stepPct={stepPct} step={step} visibleSteps={visibleSteps}>
      <div className="space-y-4">
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

        {section.video_url && (
          <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm aspect-video">
            <iframe src={getEmbedUrl(section.video_url)} className="w-full h-full" allowFullScreen title={section.title} />
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-black text-gray-900 mb-3">{section.intro_title ?? section.title}</h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{section.intro_text}</p>
        </div>

        <button onClick={goNext} disabled={saving}
          className="w-full py-4 rounded-2xl text-white font-black text-base transition-opacity disabled:opacity-50"
          style={{ background: color }}>
          {saving ? 'Salvando...' : visibleSteps.includes('module') ? 'Entendi — avançar para o módulo →' : visibleSteps.includes('flashcards') ? 'Avançar para os flashcards →' : visibleSteps.includes('quiz') ? 'Ir para o quiz →' : 'Concluir seção →'}
        </button>
      </div>
    </Layout>
  )

  // ────────────────────────────────────────
  // STEP: MÓDULO EXPANDIDO
  // ────────────────────────────────────────
  if (step === 'module') return (
    <Layout section={section} color={color} stepPct={stepPct} step={step} visibleSteps={visibleSteps}>
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
          {saving ? 'Salvando...' : visibleSteps.includes('flashcards') ? 'Ótimo — partir para os flashcards 📇' : visibleSteps.includes('quiz') ? 'Partir para o quiz 📝' : 'Concluir seção →'}
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
      <Layout section={section} color={color} stepPct={stepPct} step={step} visibleSteps={visibleSteps}>
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>Card {cardIndex + 1} de {flashcards.length}</span>
            <span className="font-bold" style={{ color }}>{Math.round(((cardIndex + 1) / flashcards.length) * 100)}%</span>
          </div>

          <div className="relative h-52 cursor-pointer" onClick={() => setFlipped(f => !f)}
            style={{ perspective: '1000px' }}>
            <div className="relative w-full h-full transition-transform duration-500"
              style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
              <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-6 text-center shadow-md"
                style={{ backfaceVisibility: 'hidden', background: color }}>
                <p className="text-xs text-white/70 font-bold uppercase tracking-widest mb-3">Pergunta</p>
                <p className="text-white font-black text-lg leading-snug">{card?.front}</p>
                <p className="text-white/60 text-xs mt-4">Toque para revelar ↩</p>
              </div>
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
                {saving ? '...' : visibleSteps.includes('quiz') ? 'Quiz! →' : 'Concluir →'}
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
    <Layout section={section} color={color} stepPct={stepPct} step={step} visibleSteps={visibleSteps}>
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
            <div className={`rounded-2xl p-6 text-center ${quizScore! >= 60 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className="text-5xl font-black mb-1" style={{ color: quizScore! >= 60 ? '#16a34a' : '#dc2626' }}>{quizScore}%</p>
              <p className="font-bold text-lg">{quizScore! >= 60 ? '🎉 Aprovado!' : '😬 Tente novamente'}</p>
              <p className="text-sm text-gray-500 mt-1">
                {quizScore! >= 60 ? `+${section.points_value} pontos ganhos!` : 'Você precisa de pelo menos 60% para avançar.'}
              </p>
            </div>

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
              <button onClick={() => router.push('/trilha')}
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
    <Layout section={section} color={color} stepPct={100} step="done" visibleSteps={visibleSteps}>
      <div className="text-center space-y-6 py-8">
        <div className="text-7xl">🏅</div>
        <div>
          <h2 className="text-2xl font-black text-gray-900">Seção concluída!</h2>
          <p className="text-gray-500 mt-1">+{section.points_value} pontos adicionados</p>
        </div>
        <button onClick={() => router.push('/trilha')}
          className="w-full py-4 rounded-2xl text-white font-black text-base"
          style={{ background: color }}>
          Voltar à trilha 🚀
        </button>
        <a href="/trilha/certificado"
          className="block w-full py-3 rounded-2xl border-2 border-[#000FFF] text-[#000FFF] font-black text-sm text-center">
          🎓 Ver meu certificado
        </a>
      </div>
    </Layout>
  )
}

// ── Layout wrapper ──────────────────────────
const STEP_LABELS: Record<string, string> = {
  intro: 'Introdução',
  module: 'Módulo',
  flashcards: 'Flashcards',
  quiz: 'Quiz',
  done: '✓ Concluída',
}

function Layout({ section, color, stepPct, step, visibleSteps, children }: {
  section: Props['section']; color: string; stepPct: number; step: Step; visibleSteps: Step[]; children: React.ReactNode
}) {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header — branco com borda colorida à esquerda */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        {/* Breadcrumb */}
        <div className="px-4 pt-4 pb-2">
          <button onClick={() => router.push('/trilha')}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors mb-3">
            <span>←</span>
            <span>Trilha</span>
            {section.trail_blocks?.title && (
              <>
                <span className="text-gray-200">›</span>
                <span className="truncate max-w-[100px]">{section.trail_blocks.title}</span>
              </>
            )}
          </button>

          {/* Título com linha colorida à esquerda */}
          <div className="flex items-start gap-3">
            <div className="w-1 self-stretch rounded-full shrink-0 mt-0.5" style={{ background: color, minHeight: '32px' }} />
            <h1 className="text-lg font-black text-gray-900 leading-snug">{section.title}</h1>
          </div>
        </div>

        {/* Tabs de steps — somente steps visíveis */}
        {visibleSteps.length > 1 && (
          <div className="flex px-4 gap-1 mt-2">
            {visibleSteps.map((s, i) => {
              const isActive = s === step
              const isDone = visibleSteps.indexOf(step) > i || step === 'done'
              return (
                <div key={s}
                  className={`flex-1 text-center text-[11px] font-semibold py-2 border-b-2 transition-all
                    ${isActive ? 'border-b-[#000FFF] text-[#000FFF]' : isDone ? 'border-b-green-400 text-green-600' : 'border-b-transparent text-gray-400'}`}
                  style={isActive ? { borderColor: color, color } : {}}>
                  {isDone && !isActive ? '✓' : STEP_LABELS[s]}
                </div>
              )
            })}
          </div>
        )}

        {/* Barra de progresso discreta */}
        <div className="h-0.5 bg-gray-100">
          <div className="h-full transition-all duration-500" style={{ width: `${stepPct}%`, background: color }} />
        </div>
      </div>

      <div className="px-4 pt-5">{children}</div>
    </div>
  )
}
