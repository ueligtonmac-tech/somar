import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade · Bot João',
  description: 'Política de Privacidade e Proteção de Dados da plataforma Bot João — Hub Somar Ultragaz',
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
          Esta Política de Privacidade descreve como a <strong className="text-gray-900">Arkanjia</strong>, desenvolvedora da plataforma <strong className="text-gray-900">Bot João — Hub Somar</strong>, coleta, utiliza, armazena e protege os dados pessoais dos usuários, em conformidade com a <strong className="text-gray-900">Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>.
        </p>
      </div>

      <div className="space-y-8 text-gray-700 text-sm leading-relaxed">

        {/* 1 */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#000FFF] text-white text-xs flex items-center justify-center font-bold">1</span>
            Quem somos
          </h2>
          <p>
            A <strong>Arkanjia</strong> é a empresa responsável pelo desenvolvimento e operação da plataforma <strong>Bot João — Hub Somar</strong>, sistema de onboarding digital utilizado por consultores de canais digitais da Ultragaz.
          </p>
          <ul className="mt-3 space-y-1 pl-4 border-l-2 border-gray-100">
            <li><strong>Responsáveis:</strong> Ueligton Cordeiro e Marcos Ledesma</li>
            <li><strong>Contato:</strong> <a href="mailto:contato@botjoao.com.br" className="text-[#000FFF] hover:underline">contato@botjoao.com.br</a></li>
            <li><strong>Site:</strong> <a href="https://botjoao.com.br" className="text-[#000FFF] hover:underline">botjoao.com.br</a></li>
          </ul>
        </section>

        {/* 2 */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#000FFF] text-white text-xs flex items-center justify-center font-bold">2</span>
            Dados coletados
          </h2>
          <p className="mb-3">Coletamos apenas os dados estritamente necessários para o funcionamento da plataforma:</p>
          <div className="space-y-2">
            {[
              ['Nome completo', 'Identificação do consultor na plataforma'],
              ['Endereço de e-mail', 'Autenticação, comunicação e notificações'],
              ['Dados de progresso', 'Registro de módulos concluídos e cards visualizados'],
              ['Interações com o Bot João', 'Perguntas e respostas para melhoria do assistente'],
              ['Avaliações de resposta (feedback)', 'Qualidade do atendimento do assistente IA'],
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
        </section>

        {/* 3 */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#000FFF] text-white text-xs flex items-center justify-center font-bold">3</span>
            Base legal para o tratamento
          </h2>
          <p>O tratamento dos dados pessoais nesta plataforma é fundamentado nas seguintes bases legais da LGPD:</p>
          <ul className="mt-3 space-y-2 pl-4">
            <li>• <strong>Execução de contrato</strong> (Art. 7º, V) — para a prestação dos serviços de onboarding;</li>
            <li>• <strong>Legítimo interesse</strong> (Art. 7º, IX) — para melhoria contínua do assistente IA;</li>
            <li>• <strong>Consentimento</strong> (Art. 7º, I) — para envio de comunicações e notificações.</li>
          </ul>
        </section>

        {/* 4 */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#000FFF] text-white text-xs flex items-center justify-center font-bold">4</span>
            Como usamos seus dados
          </h2>
          <ul className="space-y-2 pl-4">
            <li>• Fornecer acesso à trilha de aprendizado e conteúdos;</li>
            <li>• Registrar e exibir seu progresso nos módulos;</li>
            <li>• Personalizar as respostas do assistente Bot João;</li>
            <li>• Enviar notificações relacionadas ao seu aprendizado;</li>
            <li>• Melhorar continuamente a base de conhecimento do assistente;</li>
            <li>• Garantir a segurança e integridade da plataforma.</li>
          </ul>
        </section>

        {/* 5 */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#000FFF] text-white text-xs flex items-center justify-center font-bold">5</span>
            Compartilhamento de dados
          </h2>
          <p>
            Os dados podem ser compartilhados com fornecedores de tecnologia necessários à operação da plataforma
            (<strong>Supabase</strong> — armazenamento; <strong>Vercel</strong> — hospedagem; <strong>Anthropic/OpenAI</strong> — processamento de IA),
            sempre sob termos adequados de proteção de dados. <strong>Não vendemos nem cedemos dados pessoais a terceiros.</strong>
          </p>
        </section>

        {/* 6 */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#000FFF] text-white text-xs flex items-center justify-center font-bold">6</span>
            Seus direitos como titular
          </h2>
          <p className="mb-3">Nos termos da LGPD, você tem o direito de:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              'Confirmar a existência de tratamento',
              'Acessar seus dados',
              'Corrigir dados incompletos ou incorretos',
              'Solicitar a anonimização ou exclusão',
              'Portabilidade dos dados',
              'Revogar o consentimento a qualquer momento',
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
            </a>.
          </p>
        </section>

        {/* 7 */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#000FFF] text-white text-xs flex items-center justify-center font-bold">7</span>
            Retenção e exclusão de dados
          </h2>
          <p>
            Os dados são mantidos pelo período necessário à prestação dos serviços e cumprimento de obrigações legais.
            Dados de interação com o assistente são retidos por até <strong>24 meses</strong> para fins de melhoria do sistema.
            Após o encerramento do acesso, os dados são anonimizados ou excluídos em até <strong>90 dias</strong>, salvo obrigação legal.
          </p>
        </section>

        {/* 8 */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#000FFF] text-white text-xs flex items-center justify-center font-bold">8</span>
            Segurança
          </h2>
          <p>
            Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados, incluindo autenticação segura,
            criptografia em trânsito (TLS), controle de acesso por função (<em>role-based access control</em>)
            e políticas de segurança em nível de banco de dados (RLS — Row Level Security).
          </p>
        </section>

        {/* 9 */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#000FFF] text-white text-xs flex items-center justify-center font-bold">9</span>
            Alterações nesta política
          </h2>
          <p>
            Esta política pode ser atualizada periodicamente. Notificaremos os usuários sobre alterações relevantes
            através da própria plataforma. O uso continuado após a publicação de alterações constitui aceite das novas condições.
          </p>
        </section>

        {/* 10 */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#000FFF] text-white text-xs flex items-center justify-center font-bold">10</span>
            Contato e DPO
          </h2>
          <p>
            Para dúvidas, solicitações ou exercício de direitos relacionados à proteção de dados, entre em contato:
          </p>
          <div className="mt-3 bg-white border border-gray-100 rounded-xl p-4">
            <p className="font-bold text-gray-900">Arkanjia</p>
            <p className="text-gray-500 text-xs mt-1">Responsáveis: Ueligton Cordeiro e Marcos Ledesma</p>
            <a href="mailto:contato@botjoao.com.br" className="text-[#000FFF] font-semibold text-sm hover:underline mt-1 block">
              contato@botjoao.com.br
            </a>
          </div>
        </section>

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
