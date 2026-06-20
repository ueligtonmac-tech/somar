'use client'

import { useState, useTransition } from 'react'
import { updateSection, upsertFlashcard, deleteFlashcard, upsertQuizQuestion, deleteQuizQuestion, generateFlashcardsAI, generateQuizAI } from './actions'

type Tab = 'section' | 'flashcards' | 'quiz'

interface Flashcard { id: string; front: string; back: string; order_index: number }
interface QuizQuestion { id: string; question: string; options: string[]; correct_index: number; explanation: string; order_index: number }
interface LibraryFile { id: string; title: string }

interface SectionData {
  id: string
  title: string
  intro_title: string | null
  intro_text: string | null
  video_url: string | null
  points_value: number
  trail_blocks: { title: string; color: string; icon: string } | null
}

interface Props {
  section: SectionData
  flashcards: Flashcard[]
  quizQuestions: QuizQuestion[]
  libraryFiles: LibraryFile[]
}

export default function SectionEditor({ section, flashcards: initialFlashcards, quizQuestions: initialQuiz }: Props) {
  const [tab, setTab] = useState<Tab>('section')
  const [isPending, startTransition] = useTransition()

  // Section fields
  const [introTitle, setIntroTitle] = useState(section.intro_title ?? '')
  const [introText, setIntroText] = useState(section.intro_text ?? '')
  const [videoUrl, setVideoUrl] = useState(section.video_url ?? '')
  const [pointsValue, setPointsValue] = useState(section.points_value)
  const [sectionSaved, setSectionSaved] = useState(false)

  // Flashcards
  const [flashcards, setFlashcards] = useState<(Flashcard & { _new?: boolean })[]>(initialFlashcards)
  const [flashSaving, setFlashSaving] = useState<string | null>(null)
  const [aiFlashLoading, setAiFlashLoading] = useState(false)

  // Quiz
  const [quizQuestions, setQuizQuestions] = useState<(QuizQuestion & { _new?: boolean })[]>(initialQuiz)
  const [quizSaving, setQuizSaving] = useState<string | null>(null)
  const [aiQuizLoading, setAiQuizLoading] = useState(false)

  const color = section.trail_blocks?.color ?? '#000FFF'

  // ── Section save ──
  function handleSaveSection() {
    startTransition(async () => {
      await updateSection(section.id, {
        intro_title: introTitle,
        intro_text: introText,
        video_url: videoUrl || undefined,
        points_value: pointsValue,
      })
      setSectionSaved(true)
      setTimeout(() => setSectionSaved(false), 2000)
    })
  }

  // ── Flashcard helpers ──
  function addFlashcard() {
    const tempId = `new-${Date.now()}`
    setFlashcards(prev => [...prev, { id: tempId, front: '', back: '', order_index: prev.length, _new: true }])
  }

  async function saveFlashcard(fc: Flashcard & { _new?: boolean }) {
    setFlashSaving(fc.id)
    try {
      await upsertFlashcard(section.id, {
        id: fc._new ? undefined : fc.id,
        front: fc.front,
        back: fc.back,
        order_index: fc.order_index,
      })
    } finally {
      setFlashSaving(null)
    }
  }

  async function handleDeleteFlashcard(id: string) {
    if (!confirm('Excluir este flashcard?')) return
    setFlashcards(prev => prev.filter(f => f.id !== id))
    const isNew = id.startsWith('new-')
    if (!isNew) await deleteFlashcard(id, section.id)
  }

  async function handleGenerateFlashcardsAI() {
    setAiFlashLoading(true)
    try {
      await generateFlashcardsAI(section.id)
      // Recarrega via refresh
      window.location.reload()
    } finally {
      setAiFlashLoading(false)
    }
  }

  // ── Quiz helpers ──
  function addQuizQuestion() {
    const tempId = `new-${Date.now()}`
    setQuizQuestions(prev => [...prev, {
      id: tempId,
      question: '',
      options: ['', '', '', ''],
      correct_index: 0,
      explanation: '',
      order_index: prev.length,
      _new: true,
    }])
  }

  async function saveQuizQuestion(q: QuizQuestion & { _new?: boolean }) {
    setQuizSaving(q.id)
    try {
      await upsertQuizQuestion(section.id, {
        id: q._new ? undefined : q.id,
        question: q.question,
        options: q.options,
        correct_index: q.correct_index,
        explanation: q.explanation,
        order_index: q.order_index,
      })
    } finally {
      setQuizSaving(null)
    }
  }

  async function handleDeleteQuiz(id: string) {
    if (!confirm('Excluir esta questão?')) return
    setQuizQuestions(prev => prev.filter(q => q.id !== id))
    const isNew = id.startsWith('new-')
    if (!isNew) await deleteQuizQuestion(id, section.id)
  }

  async function handleGenerateQuizAI() {
    setAiQuizLoading(true)
    try {
      await generateQuizAI(section.id)
      window.location.reload()
    } finally {
      setAiQuizLoading(false)
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'section', label: 'Seção' },
    { id: 'flashcards', label: `Flashcards (${flashcards.length})` },
    { id: 'quiz', label: `Quiz (${quizQuestions.length})` },
  ]

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all
              ${tab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: SECTION ── */}
      {tab === 'section' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Título da introdução</label>
              <input
                type="text"
                value={introTitle}
                onChange={e => setIntroTitle(e.target.value)}
                placeholder={section.title}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#000FFF]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Texto de introdução</label>
              <textarea
                value={introText}
                onChange={e => setIntroText(e.target.value)}
                rows={6}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#000FFF] resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">URL do vídeo (YouTube / Vimeo)</label>
              <input
                type="text"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#000FFF]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Pontos desta seção</label>
              <input
                type="number"
                value={pointsValue}
                onChange={e => setPointsValue(Number(e.target.value))}
                className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#000FFF]"
              />
            </div>
          </div>

          <button
            onClick={handleSaveSection}
            disabled={isPending}
            className="w-full py-3 rounded-2xl text-white font-black text-sm disabled:opacity-50 transition-colors"
            style={{ background: color }}>
            {isPending ? 'Salvando...' : sectionSaved ? '✓ Salvo!' : 'Salvar seção'}
          </button>
        </div>
      )}

      {/* ── TAB: FLASHCARDS ── */}
      {tab === 'flashcards' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={addFlashcard}
              className="flex-1 py-2.5 rounded-xl border-2 border-dashed border-gray-300 text-sm font-bold text-gray-500 hover:border-[#000FFF] hover:text-[#000FFF] transition-colors">
              ＋ Novo flashcard
            </button>
            <button onClick={handleGenerateFlashcardsAI} disabled={aiFlashLoading}
              className="px-4 py-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-sm font-bold hover:bg-purple-100 transition-colors disabled:opacity-50">
              {aiFlashLoading ? 'Gerando...' : '🤖 Gerar com IA'}
            </button>
          </div>

          {flashcards.map((fc, idx) => (
            <div key={fc.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-400">Card {idx + 1}</span>
                <button onClick={() => handleDeleteFlashcard(fc.id)}
                  className="text-xs text-red-400 hover:text-red-600 font-bold">
                  Excluir
                </button>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Frente (pergunta)</label>
                <textarea
                  value={fc.front}
                  rows={2}
                  onChange={e => setFlashcards(prev => prev.map(f => f.id === fc.id ? { ...f, front: e.target.value } : f))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#000FFF] resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Verso (resposta)</label>
                <textarea
                  value={fc.back}
                  rows={2}
                  onChange={e => setFlashcards(prev => prev.map(f => f.id === fc.id ? { ...f, back: e.target.value } : f))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#000FFF] resize-none"
                />
              </div>
              <button
                onClick={() => saveFlashcard(fc)}
                disabled={flashSaving === fc.id}
                className="w-full py-2 rounded-xl text-white text-xs font-bold disabled:opacity-50"
                style={{ background: color }}>
                {flashSaving === fc.id ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          ))}

          {flashcards.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              Nenhum flashcard ainda. Adicione um ou gere com IA.
            </div>
          )}
        </div>
      )}

      {/* ── TAB: QUIZ ── */}
      {tab === 'quiz' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={addQuizQuestion}
              className="flex-1 py-2.5 rounded-xl border-2 border-dashed border-gray-300 text-sm font-bold text-gray-500 hover:border-[#000FFF] hover:text-[#000FFF] transition-colors">
              ＋ Nova questão
            </button>
            <button onClick={handleGenerateQuizAI} disabled={aiQuizLoading}
              className="px-4 py-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-sm font-bold hover:bg-purple-100 transition-colors disabled:opacity-50">
              {aiQuizLoading ? 'Gerando...' : '🤖 Gerar com IA'}
            </button>
          </div>

          {quizQuestions.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-400">Questão {idx + 1}</span>
                <button onClick={() => handleDeleteQuiz(q.id)}
                  className="text-xs text-red-400 hover:text-red-600 font-bold">
                  Excluir
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Pergunta</label>
                <textarea
                  value={q.question}
                  rows={2}
                  onChange={e => setQuizQuestions(prev => prev.map(item => item.id === q.id ? { ...item, question: e.target.value } : item))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#000FFF] resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-400">Opções (marque a correta)</label>
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${q.id}`}
                      checked={q.correct_index === oi}
                      onChange={() => setQuizQuestions(prev => prev.map(item => item.id === q.id ? { ...item, correct_index: oi } : item))}
                      className="accent-[#000FFF]"
                    />
                    <input
                      type="text"
                      value={opt}
                      placeholder={`Opção ${oi + 1}`}
                      onChange={e => {
                        const newOptions = [...q.options]
                        newOptions[oi] = e.target.value
                        setQuizQuestions(prev => prev.map(item => item.id === q.id ? { ...item, options: newOptions } : item))
                      }}
                      className={`flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#000FFF]
                        ${q.correct_index === oi ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Explicação (mostrada após o quiz)</label>
                <textarea
                  value={q.explanation}
                  rows={2}
                  onChange={e => setQuizQuestions(prev => prev.map(item => item.id === q.id ? { ...item, explanation: e.target.value } : item))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#000FFF] resize-none"
                />
              </div>

              <button
                onClick={() => saveQuizQuestion(q)}
                disabled={quizSaving === q.id}
                className="w-full py-2 rounded-xl text-white text-xs font-bold disabled:opacity-50"
                style={{ background: color }}>
                {quizSaving === q.id ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          ))}

          {quizQuestions.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              Nenhuma questão ainda. Adicione uma ou gere com IA.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
