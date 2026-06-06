'use client'

export default function PrintButton() {
  return (
    <div className="print:hidden flex gap-3 justify-center mt-8">
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 bg-[#000FFF] text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-md"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
        </svg>
        Imprimir / Salvar PDF
      </button>
      <a
        href="/trilha"
        className="flex items-center gap-2 border-2 border-gray-200 text-gray-600 px-6 py-3 rounded-xl font-bold text-sm hover:border-gray-300 transition-colors"
      >
        ← Voltar à trilha
      </a>
    </div>
  )
}
