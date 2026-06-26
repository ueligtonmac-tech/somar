import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fora do ar',
  description: 'Serviço temporariamente indisponível.',
  icons: { icon: 'data:,' },
}

export default function EmConstrucaoPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-xs text-left space-y-4">

        <p className="text-sm font-mono text-gray-800">
          503 — Serviço indisponível.
        </p>

        <p className="text-xs font-mono text-gray-400 italic leading-relaxed border-l-2 border-gray-200 pl-3">
          &ldquo;Não só isso, mas também nos gloriamos nas tribulações, porque sabemos que a tribulação produz perseverança; a perseverança, um caráter aprovado; e o caráter aprovado, esperança. E a esperança não nos decepciona, porque Deus derramou seu amor em nossos corações, por meio do Espírito Santo que ele nos concedeu.&rdquo;
          <span className="block not-italic text-gray-300 mt-2">— Romanos 5:3-5</span>
        </p>

      </div>
    </div>
  )
}
