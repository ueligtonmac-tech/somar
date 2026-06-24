import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade · Bot João',
  description: 'Política de Privacidade e Proteção de Dados da plataforma Bot João — Hub Somar Ultragaz',
}

function Section({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-[#000FFF] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{num}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function InfoBox({ color, icon, title, children }: { color: 'blue' | 'orange' | 'red' | 'green' | 'yellow'; icon: string; title: string; children: React.ReactNode }) {
  const styles = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  }
  return (
    <div className={`border rounded-xl p-4 mt-3 ${styles[color]}`}>
      <p className="font-bold text-sm mb-1">{icon} {title}</p>
      <div className="text-xs leading-relaxed opacity-90">{children}</div>
    </div>
  )
}

export default function PoliticaPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <Link href="/login" className="text-[#000FFF] text-sm font-semibold hover:underline mb-6 inline-block">
          ← Voltar
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#000FFF] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Política de Privacidade</h1>
            <p className="text-sm text-gray-400">Última atualização: junho de 2026</p>
          </div>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed bg-blue-50 border border-blue-100 rounded-xl p-4">
          Esta Política de Privacidade descreve como a <strong className="text-gray-900">Arkanjia</strong> — desenvolvedora e operadora da plataforma <strong className="text-gray-900">Bot João — Hub Somar</strong> — coleta, utiliza, armazena e protege os dados pessoais dos usuários, em conformidade com a <strong className="text-gray-900">Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>, em parceria com a <strong className="text-gray-900">Ultragaz</strong>, controladora dos conteúdos disponibilizados na plataforma.
        </p>
      </div>

      <div className="space-y-8 text-gray-700 text-sm leading-relaxed">

        {/* 1 */}
        <Section num={1} title="Quem somos e a relação tripartite">
          <p>
            Esta plataforma envolve três partes com papéis distintos no tratamento de dados:
          </p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="font-bold text-blue-900 text-xs mb-1">🏗️ Arkanjia</p>
              <p className="text-xs text-blue-800 leading-relaxed">Operadora técnica. Desenvolve, mantém e opera a plataforma Bot João. Responsável pelo tratamento de dados de acesso, progresso e interações. Representada por <strong>Ueligton Cordeiro</strong> e <strong>Marcos Ledesma</strong>.</p>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
              <p className="font-bold text-orange-900 text-xs mb-1">⛽ Ultragaz</p>
              <p className="text-xs text-orange-800 leading-relaxed">Controladora de conteúdo. Fornece o conteúdo institucional, treinamentos e base de conhecimento do Bot João. Os dados de inteligência do bot são propriedade da Ultragaz e tratados em seu interesse legítimo.</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
              <p className="font-bold text-gray-700 text-xs mb-1">👤 Consultor</p>
              <p className="text-xs text-gray-600 leading-relaxed">Titular dos dados pessoais. Consultor de canais digitais da Ultragaz que utiliza a plataforma para onboarding e suporte via Bot João.</p>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-3">
            <strong>Contato Arkanjia:</strong>{' '}
            <a href="mailto:contato@botjoao.com.br" className="text-[#000FFF] hover:underline">contato@botjoao.com.br</a>
            {' · '}
            <a href="https://botjoao.com.br" className="text-[#000FFF] hover:underline">botjoao.com.br</a>
          </div>
        </Section>

        {/* 2 */}
        <Section num={2} title="Dados coletados">
          <p className="mb-3">Coletamos apenas os dados estritamente necessários para o funcionamento da plataforma:</p>
          <div className="space-y-2">
            {[
              ['Nome completo', 'Identificação do consultor na plataforma'],
              ['Endereço de e-mail', 'Autenticação, comunicação e notificações'],
              ['Dados de progresso', 'Registro de módulos concluídos e cards visualizados'],
              ['Perguntas ao Bot João', 'Processadas para gerar resposta e aprimorar a base de conhecimento da Ultragaz'],
              ['Avaliações de resposta (👍 / 👎)', 'Qualidade percebida de cada resposta do assistente IA'],
              ['Avaliação pós-conversa (CSAT)', 'Satisfação geral após período de inatividade na conversa'],
              ['Dados de acesso (IP, dispositivo)', 'Segurança e prevenção a acessos não autorizados'],
            ].map(([dado, finalidade]) => (
              <div key={dado} className="flex gap-3 bg-white border border-gray-100 rounded-lg p-3">
                <div className="w-2 h-2 rounded-full bg-[#000FFF] mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">{dado}</p>
                  <p className="text-gray-500 text-xs">{finalidade}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* 3 */}
        <Section num={3} title="Base legal para o tratamento">
          <p>O tratamento dos dados pessoais nesta plataforma é fundamentado nas seguintes bases legais da LGPD:</p>
          <ul className="mt-3 space-y-2 pl-4">
            <li>• <strong>Execução de contrato</strong> (Art. 7º, V) — para a prestação dos serviços de onboarding ao consultor;</li>
            <li>• <strong>Legítimo interesse</strong> (Art. 7º, IX) — para melhoria contínua do assistente IA e da base de conhecimento da Ultragaz;</li>
            <li>• <strong>Consentimento</strong> (Art. 7º, I) — para envio de comunicações, notificações e uso de dados de feedback.</li>
          </ul>
        </Section>

        {/* 4 */}
        <Section num={4} title="Como usamos seus dados">
          <ul className="space-y-2 pl-4">
            <li>• Fornecer acesso à trilha de aprendizado e conteúdos da Ultragaz;</li>
            <li>• Registrar e exibir seu progresso nos módulos;</li>
            <li>• Processar suas perguntas via assistente Bot João (IA);</li>
            <li>• Coletar feedbacks (👍/👎 e CSAT) para melhoria do assistente;</li>
            <li>• Encaminhar interações negativas ao time de gestão da Ultragaz (escalonamento);</li>
            <li>• Aprimorar a base de conhecimento do Bot João com base em feedbacks aprovados;</li>
            <li>• Enviar notificações relacionadas ao seu aprendizado;</li>
            <li>• Garantir a segurança e integridade da plataforma.</li>
          </ul>
          <InfoBox color="yellow" icon="⚡" title="Escalonamento automático">
            Respostas avaliadas negativamente com 👎 ou com CSAT negativo são automaticamente encaminhadas ao painel de gestão da Ultragaz para revisão humana. Nesses casos, a pergunta original e a resposta do bot são visíveis aos gestores. O consultor pode ser contatado para complementação quando necessário.
          </InfoBox>
        </Section>

        {/* 5 */}
        <Section num={5} title="Compartilhamento de dados">
          <p className="mb-3">
            Os dados são compartilhados exclusivamente com as partes necessárias à operação da plataforma:
          </p>

          <div className="space-y-2">
            <div className="bg-white border border-gray-100 rounded-lg p-3">
              <p className="font-semibold text-gray-900 text-xs">⛽ Ultragaz</p>
              <p className="text-xs text-gray-500 mt-0.5">Recebe notificações de escalonamento (feedbacks negativos), dados de uso agregados e acesso ao painel de gestão para revisão de interações. Não recebe dados pessoais além dos necessários para a finalidade.</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-lg p-3">
              <p className="font-semibold text-gray-900 text-xs">🗄️ Supabase</p>
              <p className="text-xs text-gray-500 mt-0.5">Banco de dados e autenticação. Contratado sob termos de proteção de dados compatíveis com a LGPD.</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-lg p-3">
              <p className="font-semibold text-gray-900 text-xs">☁️ Vercel</p>
              <p className="text-xs text-gray-500 mt-0.5">Hospedagem e entrega da aplicação. Opera conforme GDPR e padrões internacionais de privacidade.</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-lg p-3">
              <p className="font-semibold text-gray-900 text-xs">🤖 Anthropic / OpenAI</p>
              <p className="text-xs text-gray-500 mt-0.5">Processamento de IA para geração das respostas do Bot João. As perguntas são transmitidas a esses serviços para processamento. Veja item 6 (Transferência Internacional) abaixo.</p>
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-500 italic">
            <strong>Não vendemos, cedemos nem comercializamos dados pessoais a terceiros.</strong>
          </p>
        </Section>

        {/* 6 */}
        <Section num={6} title="Transferência internacional de dados">
          <p>
            Para geração das respostas do Bot João, as perguntas dos consultores são transmitidas a servidores da <strong>Anthropic</strong> e/ou <strong>OpenAI</strong>, localizados nos <strong>Estados Unidos da América</strong>. Essa transferência internacional é necessária ao funcionamento do assistente de IA.
          </p>
          <InfoBox color="blue" icon="🌐" title="Base legal — Art. 33 da LGPD">
            <p>A transferência é realizada com base no Art. 33, inciso V da LGPD (cooperação jurídica internacional) e nas cláusulas contratuais de proteção de dados firmadas com os fornecedores, que adotam padrões compatíveis com o GDPR europeu e as melhores práticas de privacidade internacionais.</p>
            <p className="mt-1">As informações transmitidas não incluem dados de identificação pessoal além do necessário para contextualizar a conversa. Anthropic e OpenAI não são autorizados a usar as conversas para treinar seus modelos sem consentimento explícito.</p>
          </InfoBox>
        </Section>

        {/* 7 */}
        <Section num={7} title="Seus direitos como titular">
          <p className="mb-3">Nos termos da LGPD, você tem o direito de:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              'Confirmar a existência de tratamento',
              'Acessar seus dados',
              'Corrigir dados incompletos ou incorretos',
              'Solicitar a anonimização ou exclusão',
              'Portabilidade dos dados',
              'Revogar o consentimento a qualquer momento',
              'Opor-se ao tratamento em caso de irregularidade',
              'Ser informado sobre compartilhamentos realizados',
            ].map(d => (
              <div key={d} className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg p-2.5">
                <span className="text-[#000FFF]">✓</span>
                <span className="text-xs">{d}</span>
              </div>
            ))}
          </div>
          <p className="mt-3">
            Para exercer qualquer desses direitos, entre em contato pelo e-mail{' '}
            <a href="mailto:contato@botjoao.com.br" className="text-[#000FFF] hover:underline font-semibold">
              contato@botjoao.com.br
            </a>. Responderemos em até <strong>15 dias</strong> conforme exigência da LGPD.
          </p>
        </Section>

        {/* 8 */}
        <Section num={8} title="Retenção e exclusão de dados">
          <p>
            Os dados são mantidos pelo período necessário à prestação dos serviços e cumprimento de obrigações legais:
          </p>
          <ul className="mt-3 space-y-1.5 pl-4">
            <li>• <strong>Dados de acesso e progresso:</strong> mantidos enquanto a conta estiver ativa;</li>
            <li>• <strong>Interações com o Bot João e feedbacks:</strong> retidos por até <strong>24 meses</strong> para melhoria do sistema;</li>
            <li>• <strong>Base de conhecimento aprovada (Ultragaz):</strong> mantida por prazo indeterminado, de acordo com política da Ultragaz;</li>
            <li>• <strong>Após encerramento do acesso:</strong> dados pessoais são anonimizados ou excluídos em até <strong>90 dias</strong>, salvo obrigação legal.</li>
          </ul>
        </Section>

        {/* 9 */}
        <Section num={9} title="Segurança">
          <p>
            Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados, incluindo:
          </p>
          <ul className="mt-2 space-y-1 pl-4">
            <li>• Autenticação segura com tokens gerenciados pelo Supabase;</li>
            <li>• Criptografia em trânsito (TLS 1.2+);</li>
            <li>• Controle de acesso por função (<em>role-based access control</em> — admin, gestor, consultor);</li>
            <li>• Políticas de segurança em nível de banco de dados (RLS — Row Level Security);</li>
            <li>• Acesso ao painel de escalonamento restrito a gestores autorizados pela Ultragaz.</li>
          </ul>
        </Section>

        {/* 10 */}
        <Section num={10} title="Propriedade dos dados de inteligência">
          <p>
            As perguntas e respostas do Bot João, após avaliação e aprovação pelos gestores, podem ser incorporadas à <strong>base de conhecimento</strong> do assistente. Esses dados de inteligência — incluindo conteúdo treinado, materiais institucionais e aprimoramentos linguísticos — são <strong>propriedade exclusiva da Ultragaz</strong>, que os disponibilizou como insumo da plataforma.
          </p>
          <InfoBox color="orange" icon="⛽" title="Propriedade da Ultragaz">
            O conteúdo treinado no Bot João (manuais, processos, produtos, terminologia e base de respostas) é patrimônio intelectual da Ultragaz. A Arkanjia atua como operadora técnica, sem adquirir direitos sobre esse conteúdo. A síntese em linguagem natural realizada pela IA não transfere a titularidade dos conteúdos originais.
          </InfoBox>
        </Section>

        {/* 11 */}
        <Section num={11} title="Alterações nesta política">
          <p>
            Esta política pode ser atualizada periodicamente para refletir mudanças nas práticas de tratamento de dados ou na legislação aplicável. Notificaremos os usuários sobre alterações relevantes através da própria plataforma. O uso continuado após a publicação de alterações constitui aceite das novas condições.
          </p>
        </Section>

        {/* 12 */}
        <Section num={12} title="Contato e DPO">
          <p>
            Para dúvidas, solicitações ou exercício de direitos relacionados à proteção de dados, entre em contato:
          </p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="font-bold text-gray-900 text-sm">🏗️ Arkanjia</p>
              <p className="text-gray-500 text-xs mt-1">Operadora técnica da plataforma</p>
              <p className="text-xs text-gray-500 mt-1">Responsáveis: Ueligton Cordeiro e Marcos Ledesma</p>
              <a href="mailto:contato@botjoao.com.br" className="text-[#000FFF] font-semibold text-xs hover:underline mt-1.5 block">
                contato@botjoao.com.br
              </a>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
              <p className="font-bold text-orange-900 text-sm">⛽ Ultragaz</p>
              <p className="text-orange-700 text-xs mt-1">Controladora de conteúdo</p>
              <p className="text-xs text-orange-600 mt-1">Para questões relativas ao conteúdo institucional e base de conhecimento do Bot João, consulte os canais oficiais da Ultragaz.</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            A Arkanjia não nomeia DPO (Encarregado de Proteção de Dados) formalmente neste momento, por se enquadrar nas exceções para micro e pequenas empresas previstas nos arts. 5º, VI e 41 da LGPD. Os responsáveis acima desempenham essa função de forma direta.
          </p>
        </Section>

      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
        <p>© 2026 Arkanjia · Todos os direitos reservados</p>
        <div className="flex gap-4">
          <Link href="/termos" className="hover:text-[#000FFF] transition-colors">Termos de Uso</Link>
          <Link href="/login" className="hover:text-[#000FFF] transition-colors">Voltar ao app</Link>
        </div>
      </div>
    </div>
  )
}
