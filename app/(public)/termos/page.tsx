import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Uso · Bot João',
  description: 'Termos de Uso da plataforma Bot João — Hub Somar Ultragaz, desenvolvida pela Arkanjia.',
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
          <div className="w-10 h-10 rounded-full bg-[#000FFF] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Termos de Uso</h1>
            <p className="text-sm text-gray-400">Última atualização: junho de 2026</p>
          </div>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed bg-blue-50 border border-blue-100 rounded-xl p-4">
          Ao acessar ou utilizar a plataforma <strong className="text-gray-900">Bot João — Hub Somar</strong>, você concorda com os presentes Termos de Uso.
          Leia atentamente antes de prosseguir.
        </p>
      </div>

      <div className="space-y-8 text-gray-700 text-sm leading-relaxed">

        {/* 1 */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#000FFF] text-white text-xs flex items-center justify-center font-bold">1</span>
            Sobre a plataforma
          </h2>
          <p>
            O <strong>Bot João — Hub Somar</strong> é uma plataforma de onboarding digital desenvolvida pela <strong>Arkanjia</strong>
            para uso exclusivo de consultores de canais digitais da <strong>Ultragaz</strong>. O sistema oferece trilha de aprendizado,
            assistente de inteligência artificial e gestão de conhecimento para apoiar o processo de formação e integração dos consultores.
          </p>
        </section>

        {/* 2 */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#000FFF] text-white text-xs flex items-center justify-center font-bold">2</span>
            Acesso e elegibilidade
          </h2>
          <p>O acesso à plataforma é restrito a:</p>
          <ul className="mt-2 space-y-1 pl-4">
            <li>• Consultores de canais digitais Ultragaz devidamente cadastrados;</li>
            <li>• Administradores e membros da equipe autorizados pela Arkanjia ou pela Ultragaz;</li>
            <li>• Usuários que tenham recebido convite formal de acesso.</li>
          </ul>
          <p className="mt-3">
            É proibido o acesso por terceiros não autorizados ou o compartilhamento de credenciais de acesso.
          </p>
        </section>

        {/* 3 */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#000FFF] text-white text-xs flex items-center justify-center font-bold">3</span>
            Propriedade intelectual
          </h2>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-3">
            <p className="font-bold text-gray-900 mb-1">© 2026 Arkanjia · Todos os direitos reservados</p>
            <p>
              Todo o código-fonte, design, conteúdo, marca, logotipos, assistente de IA, algoritmos, base de conhecimento
              e demais elementos da plataforma <strong>Bot João — Hub Somar</strong> são de propriedade exclusiva da <strong>Arkanjia</strong>
              e protegidos pelas leis brasileiras e internacionais de propriedade intelectual.
            </p>
          </div>
          <p>
            É expressamente proibido reproduzir, copiar, distribuir, modificar, sublicenciar, vender ou criar obras derivadas
            de qualquer parte da plataforma sem autorização prévia e por escrito da Arkanjia.
          </p>
        </section>

        {/* 4 */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#000FFF] text-white text-xs flex items-center justify-center font-bold">4</span>
            Uso do assistente de IA
          </h2>
          <p>O assistente <strong>Bot João</strong> é uma ferramenta de apoio ao aprendizado. O usuário reconhece que:</p>
          <ul className="mt-2 space-y-1 pl-4">
            <li>• As respostas são geradas por inteligência artificial e podem conter imprecisões;</li>
            <li>• O assistente não substitui orientação oficial da Ultragaz ou supervisores;</li>
            <li>• As interações podem ser revisadas para fins de melhoria da qualidade do sistema;</li>
            <li>• O uso deve ser feito de forma ética, sem tentativas de manipulação ou uso indevido.</li>
          </ul>
        </section>

        {/* 5 */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#000FFF] text-white text-xs flex items-center justify-center font-bold">5</span>
            Responsabilidades do usuário
          </h2>
          <p>O usuário se compromete a:</p>
          <ul className="mt-2 space-y-1 pl-4">
            <li>• Fornecer informações verdadeiras no cadastro;</li>
            <li>• Manter a confidencialidade de suas credenciais de acesso;</li>
            <li>• Não utilizar a plataforma para fins ilícitos ou contrários a estes termos;</li>
            <li>• Não tentar acessar dados de outros usuários ou áreas restritas;</li>
            <li>• Notificar imediatamente qualquer uso não autorizado de sua conta.</li>
          </ul>
        </section>

        {/* 6 */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#000FFF] text-white text-xs flex items-center justify-center font-bold">6</span>
            Limitação de responsabilidade
          </h2>
          <p>
            A Arkanjia não se responsabiliza por decisões tomadas com base exclusiva nas respostas do assistente IA,
            por indisponibilidade temporária do sistema decorrente de manutenção ou falhas de terceiros,
            ou por danos causados por uso indevido da plataforma pelo próprio usuário.
          </p>
        </section>

        {/* 7 */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#000FFF] text-white text-xs flex items-center justify-center font-bold">7</span>
            Suspensão e encerramento de acesso
          </h2>
          <p>
            A Arkanjia reserva-se o direito de suspender ou encerrar o acesso de qualquer usuário que viole estes Termos,
            faça uso indevido da plataforma ou deixe de atender aos critérios de elegibilidade, sem aviso prévio e sem gerar
            direito a qualquer indenização.
          </p>
        </section>

        {/* 8 */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#000FFF] text-white text-xs flex items-center justify-center font-bold">8</span>
            Alterações nos termos
          </h2>
          <p>
            A Arkanjia pode modificar estes Termos a qualquer momento. As alterações entram em vigor na data de publicação.
            O uso continuado da plataforma após a publicação de alterações constitui aceite das novas condições.
          </p>
        </section>

        {/* 9 */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#000FFF] text-white text-xs flex items-center justify-center font-bold">9</span>
            Lei aplicável e foro
          </h2>
          <p>
            Estes Termos são regidos pelas leis da República Federativa do Brasil. Eventuais disputas serão submetidas
            ao foro da comarca de domicílio da Arkanjia, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
          </p>
        </section>

        {/* 10 */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#000FFF] text-white text-xs flex items-center justify-center font-bold">10</span>
            Contato
          </h2>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
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
          <Link href="/politica" className="hover:text-[#000FFF] transition-colors">Política de Privacidade</Link>
          <Link href="/login" className="hover:text-[#000FFF] transition-colors">Voltar ao app</Link>
        </div>
      </div>
    </div>
  )
}
