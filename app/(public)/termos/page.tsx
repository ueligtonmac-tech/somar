import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Uso · Bot João',
  description: 'Termos de Uso da plataforma Bot João — Hub Somar Ultragaz, desenvolvida pela Arkanjia.',
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-[#000FFF] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
          {n}
        </span>
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function InfoBox({ color, children }: { color: 'blue' | 'amber' | 'green' | 'red'; children: React.ReactNode }) {
  const c = {
    blue:  'bg-blue-50 border-blue-100 text-blue-900',
    amber: 'bg-amber-50 border-amber-100 text-amber-900',
    green: 'bg-green-50 border-green-100 text-green-900',
    red:   'bg-red-50 border-red-100 text-red-900',
  }[color]
  return <div className={`border rounded-xl p-4 text-sm leading-relaxed ${c}`}>{children}</div>
}

export default function TermosPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="mb-10">
        <Link href="/login" className="text-[#000FFF] text-sm font-semibold hover:underline mb-6 inline-block">
          ← Voltar
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#000FFF] flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Termos de Uso</h1>
            <p className="text-sm text-gray-400">Última atualização: junho de 2026</p>
          </div>
        </div>
        <InfoBox color="blue">
          Ao acessar ou utilizar a plataforma <strong>Bot João — Hub Somar</strong>, você concorda
          integralmente com os presentes Termos de Uso. Leia atentamente antes de prosseguir.
          O não aceite implica na impossibilidade de uso da plataforma.
        </InfoBox>
      </div>

      <div className="space-y-10 text-gray-700 text-sm leading-relaxed">

        {/* 1 */}
        <Section n={1} title="Sobre a plataforma e as partes envolvidas">
          <p>
            O <strong>Bot João — Hub Somar</strong> é uma plataforma digital de onboarding e capacitação
            desenvolvida pela <strong>Arkanjia</strong>, operada em regime de licença comercial para a
            <strong>Ultragaz</strong>, para uso exclusivo de consultores de canais digitais e equipes autorizadas.
          </p>
          <p>
            A relação jurídica desta plataforma envolve três partes:
          </p>
          <div className="space-y-2">
            {[
              ['Arkanjia', 'Desenvolvedora, proprietária da tecnologia e operadora da plataforma (Ueligton Cordeiro e Marcos Ledesma).'],
              ['Ultragaz', 'Contratante e proprietária do conteúdo de conhecimento utilizado na capacitação dos consultores.'],
              ['Consultor (Usuário)', 'Profissional autorizado que utiliza a plataforma para formação e suporte operacional.'],
            ].map(([parte, desc]) => (
              <div key={parte} className="flex gap-3 bg-white border border-gray-100 rounded-lg p-3">
                <div className="w-2 h-2 rounded-full bg-[#000FFF] mt-1.5 flex-shrink-0" />
                <div><p className="font-semibold text-gray-900">{parte}</p><p className="text-gray-500 text-xs">{desc}</p></div>
              </div>
            ))}
          </div>
        </Section>

        {/* 2 */}
        <Section n={2} title="Acesso e elegibilidade">
          <p>O acesso é restrito a:</p>
          <ul className="space-y-1 pl-4">
            <li>• Consultores de canais digitais Ultragaz devidamente cadastrados e aprovados;</li>
            <li>• Administradores e membros de equipe autorizados pela Arkanjia ou pela Ultragaz;</li>
            <li>• Usuários que tenham recebido convite formal e validado de acesso.</li>
          </ul>
          <p>
            É expressamente proibido o acesso por terceiros não autorizados, o compartilhamento de
            credenciais ou qualquer tentativa de burlar os mecanismos de controle de acesso.
            O descumprimento enseja a imediata suspensão sem direito a aviso prévio.
          </p>
        </Section>

        {/* 3 */}
        <Section n={3} title="Propriedade intelectual — dupla titularidade">

          <InfoBox color="amber">
            <p className="font-bold text-gray-900 mb-2">Atenção — Dois titulares distintos</p>
            <p>
              Esta plataforma possui elementos de propriedade intelectual de dois titulares independentes,
              com proteções e direitos distintos. Nenhuma das partes pode ceder, sublicenciar ou explorar
              os ativos da outra sem autorização expressa.
            </p>
          </InfoBox>

          <div className="rounded-xl border border-gray-100 overflow-hidden">
            {/* Arkanjia */}
            <div className="bg-blue-50 px-5 py-4 border-b border-gray-100">
              <p className="font-black text-[#000FFF] mb-1">🏗 Propriedade da Arkanjia</p>
              <p className="text-xs text-gray-600 mb-3">
                Representada por Ueligton Cordeiro e Marcos Ledesma. Protegida pela Lei nº 9.610/1998
                (Direitos Autorais) e Lei nº 9.279/1996 (Propriedade Industrial).
              </p>
              <ul className="space-y-1 text-xs text-gray-700">
                {[
                  'Código-fonte, arquitetura e infraestrutura da plataforma',
                  'Bot João — motor de IA, interface, lógica de processamento e marca',
                  'Sistema de trilha de aprendizado, gamificação e pontuação',
                  'Design, identidade visual e experiência de usuário da plataforma',
                  'Algoritmos de escalonamento, feedback e base de conhecimento vetorial',
                  'Marca "Bot João", "Hub Somar" e demais denominações da plataforma',
                  'Infraestrutura de banco de dados, APIs e integrações',
                ].map(item => (
                  <li key={item} className="flex gap-2"><span className="text-[#000FFF] font-bold mt-0.5">·</span>{item}</li>
                ))}
              </ul>
            </div>

            {/* Ultragaz */}
            <div className="bg-orange-50 px-5 py-4">
              <p className="font-black text-orange-700 mb-1">📋 Propriedade da Ultragaz</p>
              <p className="text-xs text-gray-600 mb-3">
                Todo conteúdo de origem Ultragaz permanece sob sua titularidade, independentemente
                da forma em que seja apresentado, processado ou sintetizado pela plataforma.
              </p>
              <ul className="space-y-1 text-xs text-gray-700">
                {[
                  'Materiais didáticos, documentos e conteúdos fornecidos para a plataforma',
                  'Informações sobre produtos, processos, preços e operações da Ultragaz',
                  'Base de conhecimento resultante — o conteúdo sintetizado pelo Bot João a partir de materiais Ultragaz',
                  'Marca "Ultragaz", logotipos e demais elementos de identidade da empresa',
                  'Dados operacionais e comerciais inseridos ou derivados de fontes Ultragaz',
                ].map(item => (
                  <li key={item} className="flex gap-2"><span className="text-orange-500 font-bold mt-0.5">·</span>{item}</li>
                ))}
              </ul>
              <p className="text-xs text-gray-500 mt-3 italic">
                O fato de o Bot João processar e apresentar o conteúdo em linguagem natural não altera
                a titularidade do conhecimento subjacente, que permanece da Ultragaz.
              </p>
            </div>
          </div>

          <p>
            É expressamente proibido reproduzir, copiar, distribuir, modificar, sublicenciar ou criar
            obras derivadas de qualquer elemento desta plataforma sem autorização prévia e por escrito
            do respectivo titular.
          </p>
        </Section>

        {/* 4 */}
        <Section n={4} title="Confidencialidade do conteúdo">
          <InfoBox color="red">
            <p className="font-bold mb-1">Informação confidencial</p>
            <p>
              Todo o conteúdo acessado nesta plataforma — incluindo materiais de treinamento, processos
              operacionais, informações sobre produtos e respostas do Bot João — é considerado
              <strong>informação confidencial e proprietária</strong>. O acesso é concedido exclusivamente
              para fins de capacitação profissional no âmbito da relação com a Ultragaz.
            </p>
          </InfoBox>
          <p>O usuário se compromete a:</p>
          <ul className="space-y-1 pl-4">
            <li>• Não reproduzir, capturar, copiar ou distribuir conteúdo da plataforma para terceiros;</li>
            <li>• Não utilizar o conteúdo para fins alheios à sua atividade como consultor Ultragaz;</li>
            <li>• Não compartilhar respostas do Bot João em canais públicos ou concorrentes;</li>
            <li>• Tratar como confidencial qualquer informação operacional ou comercial acessada;</li>
            <li>• Manter a confidencialidade mesmo após o encerramento do acesso à plataforma.</li>
          </ul>
          <p>
            A violação desta cláusula pode gerar responsabilidade civil e criminal perante a Arkanjia
            e/ou a Ultragaz, independentemente da existência de dano comprovado.
          </p>
        </Section>

        {/* 5 */}
        <Section n={5} title="Uso do assistente de IA (Bot João)">
          <p>O assistente <strong>Bot João</strong> é uma ferramenta de apoio ao aprendizado. O usuário reconhece que:</p>
          <ul className="space-y-1 pl-4">
            <li>• As respostas são geradas por inteligência artificial e podem conter imprecisões;</li>
            <li>• O assistente não substitui orientação oficial da Ultragaz, supervisores ou documentos normativos;</li>
            <li>• As interações (perguntas e respostas) são armazenadas e podem ser revisadas para melhoria do sistema;</li>
            <li>• Avaliações negativas (👎 ou CSAT) são automaticamente encaminhadas para revisão por gestores;</li>
            <li>• O uso deve ser ético, sem tentativas de manipulação, extração indevida de dados ou uso fora do contexto profissional.</li>
          </ul>
          <InfoBox color="blue">
            <p>
              As interações com o Bot João que receberem avaliação negativa serão escaladas automaticamente
              para revisão humana por gestores autorizados. Ao utilizar a plataforma, o usuário consente
              com essa revisão para fins de melhoria do serviço.
            </p>
          </InfoBox>
        </Section>

        {/* 6 */}
        <Section n={6} title="Responsabilidades do usuário">
          <p>O usuário se compromete a:</p>
          <ul className="space-y-1 pl-4">
            <li>• Fornecer informações verdadeiras e atualizadas no cadastro;</li>
            <li>• Manter a confidencialidade de suas credenciais de acesso;</li>
            <li>• Não utilizar a plataforma para fins ilícitos ou contrários a estes Termos;</li>
            <li>• Não tentar acessar dados de outros usuários ou áreas restritas;</li>
            <li>• Não utilizar ferramentas automatizadas para extração de dados (scraping);</li>
            <li>• Notificar imediatamente qualquer uso não autorizado de sua conta.</li>
          </ul>
        </Section>

        {/* 7 */}
        <Section n={7} title="Limitação de responsabilidade">
          <p>
            A Arkanjia não se responsabiliza por: (i) decisões tomadas com base exclusiva nas respostas
            do assistente IA; (ii) indisponibilidade temporária do sistema decorrente de manutenção ou
            falhas de terceiros; (iii) danos causados por uso indevido da plataforma pelo próprio usuário;
            (iv) imprecisões no conteúdo gerado pelo Bot João quando este não reflita com exatidão
            informações oficiais da Ultragaz. A responsabilidade da Arkanjia limita-se ao valor
            contratualmente estabelecido com a Ultragaz.
          </p>
        </Section>

        {/* 8 */}
        <Section n={8} title="Suspensão e encerramento de acesso">
          <p>
            A Arkanjia e/ou a Ultragaz reservam-se o direito de suspender ou encerrar o acesso de
            qualquer usuário que viole estes Termos, faça uso indevido da plataforma, divulgue
            informações confidenciais ou deixe de atender aos critérios de elegibilidade,
            sem aviso prévio e sem gerar direito a qualquer indenização.
          </p>
        </Section>

        {/* 9 */}
        <Section n={9} title="Relacionamento entre Arkanjia e Ultragaz">
          <p>
            A Arkanjia atua como <strong>prestadora de serviços tecnológicos</strong> para a Ultragaz,
            desenvolvendo e operando esta plataforma sob contrato de licença e prestação de serviços.
            Os presentes Termos de Uso regulam a relação entre o usuário (consultor) e a plataforma,
            não criando vínculo empregatício, societário ou de qualquer outra natureza entre o usuário
            e a Arkanjia ou a Ultragaz.
          </p>
          <p>
            A gestão do conteúdo de conhecimento inserido na plataforma, bem como as decisões sobre
            sua atualização e utilização no contexto da capacitação, são de responsabilidade da Ultragaz.
            A Arkanjia é responsável pela operação técnica, segurança e manutenção da infraestrutura.
          </p>
        </Section>

        {/* 10 */}
        <Section n={10} title="Alterações nos termos">
          <p>
            A Arkanjia pode modificar estes Termos a qualquer momento, com ou sem aviso prévio.
            As alterações entram em vigor na data de publicação. O uso continuado da plataforma
            após a publicação de alterações constitui aceite das novas condições. Alterações
            substanciais serão comunicadas via notificação na plataforma.
          </p>
        </Section>

        {/* 11 */}
        <Section n={11} title="Lei aplicável e foro">
          <p>
            Estes Termos são regidos pelas leis da República Federativa do Brasil, incluindo a
            Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018), a Lei de Direitos Autorais
            (Lei nº 9.610/1998) e o Código Civil Brasileiro. Eventuais disputas serão submetidas
            ao foro da comarca de domicílio da Arkanjia, com renúncia expressa a qualquer outro,
            por mais privilegiado que seja.
          </p>
        </Section>

        {/* 12 */}
        <Section n={12} title="Contato">
          <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-1">
            <p className="font-bold text-gray-900">Arkanjia</p>
            <p className="text-gray-500 text-xs">Responsáveis: Ueligton Cordeiro e Marcos Ledesma</p>
            <a href="mailto:contato@botjoao.com.br" className="text-[#000FFF] font-semibold text-sm hover:underline block">
              contato@botjoao.com.br
            </a>
            <p className="text-gray-400 text-xs pt-1">
              Para notificações de violação de propriedade intelectual, utilize o mesmo canal com o
              assunto: <em>Notificação Legal — PI</em>.
            </p>
          </div>
        </Section>

      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
        <p>© 2026 Arkanjia · Todos os direitos reservados</p>
        <div className="flex gap-4">
          <Link href="/politica" className="hover:text-[#000FFF] transition-colors">Política de Privacidade</Link>
          <Link href="/login" className="hover:text-[#000FFF] transition-colors">Voltar ao app</Link>
        </div>
      </div>
    </div>
  )
}
