import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Em breve',
  description: 'Plataforma em preparação.',
  icons: {
    icon: '/favicon-blank.ico',
    shortcut: '/favicon-blank.ico',
    apple: '/favicon-blank.ico',
  },
}

export default function EmConstrucaoPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-sm text-center space-y-6">

        <p className="text-xs font-semibold uppercase tracking-widest text-gray-300">
          Bot João · Hub Somar
        </p>

        <h1 className="text-2xl font-semibold text-gray-800">
          Voltamos em breve.
        </h1>

        <p className="text-sm text-gray-400 italic font-light leading-relaxed">
          &ldquo;Não só isso, mas também nos gloriamos nas tribulações, porque sabemos que a tribulação produz perseverança; a perseverança, um caráter aprovado; e o caráter aprovado, esperança. E a esperança não nos decepciona, porque Deus derramou seu amor em nossos corações, por meio do Espírito Santo que ele nos concedeu.&rdquo;
          <span className="block not-italic text-gray-300 text-xs mt-2">Romanos 5:3-5</span>
        </p>

        <div className="w-8 h-px bg-gray-200 mx-auto" />

        <p className="text-xs text-gray-300 leading-relaxed">
          Acesso restrito a consultores Ultragaz autorizados.
        </p>

      </div>
    </div>
  )
}
