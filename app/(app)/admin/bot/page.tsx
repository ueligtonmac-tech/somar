import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import FeedbackCard from './FeedbackCard'
import EscalationCard from './EscalationCard'
import KnowledgeItem from './KnowledgeItem'
import AddKnowledgeTab from './AddKnowledgeTab'
import KnowledgeThermometer from './KnowledgeThermometer'
import RagIndexPanel from '@/components/RagIndexPanel'

export default async function BotAdminPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Service client bypassa RLS — necessário para admin ver feedback de todos os usuários
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: me } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'builder'].includes(me.role)) redirect('/trilha')

  const tab = searchParams.tab || 'learning'

  // Buscar contadores (resiliente a tabelas/colunas ausentes)
  const [r1, r2, r3, r4] = await Promise.all([
    service.from('bot_feedback').select('*', { count: 'exact', head: true })
      .eq('escalated', false).eq('reviewed', false).gte('score', 7),
    service.from('bot_feedback').select('*', { count: 'exact', head: true })
      .eq('escalated', true).eq('reviewed', false),
    service.from('bot_knowledge').select('*', { count: 'exact', head: true }).eq('approved', true),
    service.from('bot_messages').select('*', { count: 'exact', head: true }).eq('role', 'user'),
  ])
  const pendingLearning = r1.count
  const pendingEscalations = r2.count
  const totalKnowledge = r3.count
  const totalMessages = r4.count

  // Buscar dados da aba ativa (sem join profiles para evitar erro de FK)
  type FeedbackRow = { id: string; question: string; answer: string; score: number; created_at: string; conversation_id: string; user_id: string }
  let feedbackItems: FeedbackRow[] = []
  let escalationItems: FeedbackRow[] = []
  let knowledgeItems: { id: string; question: string; answer: string; created_at: string }[] = []
  // Termômetro
  type AreaScore = { area: string; icon: string; knowledgeCount: number; avgScore: number | null; totalFeedback: number }
  let thermometerAreas: AreaScore[] = []
  // Mapa userId → nome (busca separada)
  const userNames = new Map<string, string>()

  if (tab === 'learning') {
    const { data } = await service
      .from('bot_feedback')
      .select('id, question, answer, score, created_at, conversation_id, user_id')
      .eq('escalated', false)
      .eq('reviewed', false)
      .gte('score', 7)
      .order('score', { ascending: false })
      .limit(50)
    feedbackItems = data || []
    // Buscar nomes dos usuários
    const uids1: string[] = Array.from(new Set(feedbackItems.map(f => f.user_id))).filter(Boolean) as string[]
    if (uids1.length > 0) {
      const { data: ps } = await service.from('profiles').select('id, full_name').in('id', uids1)
      ps?.forEach(p => p.full_name && userNames.set(p.id, p.full_name))
    }
  } else if (tab === 'escalations') {
    const { data } = await service
      .from('bot_feedback')
      .select('id, question, answer, score, created_at, conversation_id, user_id')
      .eq('escalated', true)
      .eq('reviewed', false)
      .order('score', { ascending: true })
      .limit(50)
    escalationItems = data || []
    const uids2 = Array.from(new Set(escalationItems.map(f => f.user_id).filter((id): id is string => Boolean(id))))
    if (uids2.length > 0) {
      const { data: ps } = await service.from('profiles').select('id, full_name').in('id', uids2)
      ps?.forEach(p => p.full_name && userNames.set(p.id, p.full_name))
    }
  } else if (tab === 'knowledge') {
    const { data } = await service
      .from('bot_knowledge')
      .select('id, question, answer, created_at')
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(100)
    knowledgeItems = data || []
  } else if (tab === 'thermometer') {
    // Busca todos os conhecimentos e feedbacks para calcular o termômetro
    const AREAS = [
      { area: 'Canais Digitais', icon: '📱', keywords: ['canal', 'digital', 'app', 'whatsapp', 'aplicativo', 'site'] },
      { area: 'Vale Gás', icon: '🔵', keywords: ['vale', 'gás', 'gas', 'benefício', 'mapa', 'validação', 'map'] },
      { area: 'Bot João', icon: '🤖', keywords: ['bot', 'joao', 'onboarding', 'pedido', 'gestão', 'roteirização', 'entregador'] },
      { area: 'AmigU', icon: '🤝', keywords: ['amigu', 'fidelidade', 'programa', 'pontos', 'revendedor'] },
      { area: 'Precificação', icon: '💰', keywords: ['preço', 'precific', 'faturamento', 'custo', 'margem', 'valor'] },
      { area: 'Ultragaz Geral', icon: '🏢', keywords: ['ultragaz', 'empresa', 'missão', 'valor', 'cultura', 'história'] },
    ]

    const [{ data: allKnowledge }, { data: allFeedback }] = await Promise.all([
      service.from('bot_knowledge').select('question, answer').eq('approved', true).limit(300),
      service.from('bot_feedback').select('question, score').limit(500),
    ])

    thermometerAreas = AREAS.map(({ area, icon, keywords }) => {
      const kItems = (allKnowledge || []).filter(k =>
        keywords.some(kw => (k.question + ' ' + k.answer).toLowerCase().includes(kw))
      )
      const fItems = (allFeedback || []).filter(f =>
        keywords.some(kw => (f.question || '').toLowerCase().includes(kw))
      )
      const avgScore = fItems.length > 0
        ? fItems.reduce((s, f) => s + (f.score || 0), 0) / fItems.length
        : null

      return { area, icon, knowledgeCount: kItems.length, avgScore, totalFeedback: fItems.length }
    })
  }

  const tabs = [
    { key: 'learning', label: 'Aprendizado', icon: '🧠', count: pendingLearning ?? 0, color: 'text-green-600' },
    { key: 'escalations', label: 'Escalonamentos', icon: '🚨', count: pendingEscalations ?? 0, color: 'text-red-500' },
    { key: 'knowledge', label: 'Base de Conhecimento', icon: '📚', count: totalKnowledge ?? 0, color: 'text-blue-600' },
    { key: 'add', label: 'Adicionar', icon: '➕', count: 0, color: 'text-purple-600' },
    { key: 'thermometer', label: 'Termômetro', icon: '🌡️', count: 0, color: 'text-orange-500' },
    { key: 'rag', label: 'Busca Semântica', icon: '🔬', count: 0, color: 'text-indigo-600' },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-2xl overflow-hidden bg-[#000FFF] flex-shrink-0">
            <Image src="/bot-joao.webp" alt="Bot João" width={40} height={40} className="object-contain scale-110" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Painel Bot João</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              <span className="text-[#000FFF] font-bold">{totalMessages ?? 0}</span> perguntas respondidas ·{' '}
              <span className="text-green-600 font-bold">{totalKnowledge ?? 0}</span> conhecimentos aprovados
            </p>
          </div>
        </div>
      </div>

      {/* Stats rápidos */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Aguardando aprovação', value: pendingLearning ?? 0, color: 'bg-green-50 border-green-100', text: 'text-green-700', icon: '🧠' },
          { label: 'Escalonamentos abertos', value: pendingEscalations ?? 0, color: 'bg-red-50 border-red-100', text: 'text-red-600', icon: '🚨' },
          { label: 'Base de conhecimento', value: totalKnowledge ?? 0, color: 'bg-blue-50 border-blue-100', text: 'text-blue-700', icon: '📚' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className={`text-3xl font-black ${s.text}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(t => (
          <Link
            key={t.key}
            href={`/admin/bot?tab=${t.key}`}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === t.key
                ? 'bg-[#000FFF] text-white shadow-sm'
                : 'bg-white text-gray-500 border border-gray-100 hover:border-gray-300'
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
            {t.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${
                tab === t.key ? 'bg-white/20 text-white' : `bg-gray-100 ${t.color}`
              }`}>
                {t.count}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* ─── ABA: APRENDIZADO ─── */}
      {tab === 'learning' && (
        <div>
          {feedbackItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <span className="text-5xl mb-4">🧠</span>
              <p className="font-semibold text-gray-500">Nenhuma resposta aguardando aprovação</p>
              <p className="text-sm mt-1">Quando usuários avaliarem respostas com ≥ 7, elas aparecerão aqui</p>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-3 mb-5 flex items-start gap-3">
                <span className="text-blue-500 text-lg mt-0.5">ℹ️</span>
                <div>
                  <p className="text-sm font-semibold text-blue-800">Como funciona o aprendizado</p>
                  <p className="text-xs text-blue-600 mt-0.5">Respostas aprovadas são adicionadas à base de conhecimento e o Bot João passa a usar esse conteúdo como contexto nas próximas conversas. Você pode editar a resposta antes de aprovar.</p>
                </div>
              </div>
              <div className="space-y-4">
                {feedbackItems.map(item => (
                  <FeedbackCard
                    key={item.id}
                    item={{
                      ...item,
                      user_name: userNames.get(item.user_id) ?? undefined,
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── ABA: ESCALONAMENTOS ─── */}
      {tab === 'escalations' && (
        <div>
          {escalationItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <span className="text-5xl mb-4">✅</span>
              <p className="font-semibold text-gray-500">Nenhum escalonamento pendente</p>
              <p className="text-sm mt-1">Quando usuários avaliarem respostas com &lt; 7, elas aparecerão aqui</p>
            </div>
          ) : (
            <>
              <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-3 mb-5 flex items-start gap-3">
                <span className="text-red-500 text-lg mt-0.5">🚨</span>
                <div>
                  <p className="text-sm font-semibold text-red-800">Respostas insatisfatórias</p>
                  <p className="text-xs text-red-500 mt-0.5">Essas perguntas não foram bem respondidas pelo bot. Escreva a resposta correta para enviar ao consultor. Itens mais urgentes (score menor) aparecem primeiro.</p>
                </div>
              </div>
              <div className="space-y-4">
                {escalationItems.map(item => (
                  <EscalationCard
                    key={item.id}
                    item={{
                      ...item,
                      user_name: userNames.get(item.user_id) ?? undefined,
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── ABA: ADICIONAR CONHECIMENTO ─── */}
      {tab === 'add' && (
        <div>
          <div className="bg-purple-50 border border-purple-100 rounded-2xl px-5 py-3 mb-5 flex items-start gap-3">
            <span className="text-purple-500 text-lg mt-0.5">➕</span>
            <div>
              <p className="text-sm font-semibold text-purple-800">Adicionar conhecimento manualmente</p>
              <p className="text-xs text-purple-600 mt-0.5">Insira pares de pergunta/resposta diretamente, importe via CSV ou extraia conteúdo de uma URL.</p>
            </div>
          </div>
          <AddKnowledgeTab />
        </div>
      )}

      {/* ─── ABA: BASE DE CONHECIMENTO ─── */}
      {tab === 'knowledge' && (
        <div>
          {knowledgeItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <span className="text-5xl mb-4">📚</span>
              <p className="font-semibold text-gray-500">Base de conhecimento vazia</p>
              <p className="text-sm mt-1">Aprove respostas na aba Aprendizado para começar a treinar o bot</p>
            </div>
          ) : (
            <>
              <div className="bg-green-50 border border-green-100 rounded-2xl px-5 py-3 mb-5 flex items-start gap-3">
                <span className="text-green-500 text-lg mt-0.5">📚</span>
                <div>
                  <p className="text-sm font-semibold text-green-800">Base de conhecimento ativa</p>
                  <p className="text-xs text-green-600 mt-0.5">
                    O Bot João usa esses <strong>{knowledgeItems.length} pares</strong> de pergunta/resposta como contexto em cada conversa. Quanto mais aprovações, mais preciso ele fica.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {knowledgeItems.map(item => (
                  <KnowledgeItem key={item.id} item={item} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── ABA: BUSCA SEMÂNTICA / RAG ─── */}
      {tab === 'rag' && (
        <div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-3 mb-5 flex items-start gap-3">
            <span className="text-indigo-500 text-lg mt-0.5">🔬</span>
            <div>
              <p className="text-sm font-semibold text-indigo-800">Busca Semântica com Embeddings</p>
              <p className="text-xs text-indigo-600 mt-0.5">Indexe o conteúdo para que o Bot João use inteligência vetorial. Em vez de buscar por palavras-chave, ele entende o <em>significado</em> da pergunta e encontra as respostas mais relevantes.</p>
            </div>
          </div>
          <RagIndexPanel />
        </div>
      )}

      {/* ─── ABA: TERMÔMETRO ─── */}
      {tab === 'thermometer' && (
        <div>
          <div className="bg-orange-50 border border-orange-100 rounded-2xl px-5 py-3 mb-5 flex items-start gap-3">
            <span className="text-orange-500 text-lg mt-0.5">🌡️</span>
            <div>
              <p className="text-sm font-semibold text-orange-800">Termômetro de Conhecimento</p>
              <p className="text-xs text-orange-600 mt-0.5">Visualize o nível de preparo do Bot João por área. O score combina quantidade de conhecimentos aprovados (50%) com as avaliações dos usuários (50%). Áreas em vermelho precisam de mais material.</p>
            </div>
          </div>
          <KnowledgeThermometer areas={thermometerAreas} />
        </div>
      )}
    </div>
  )
}
