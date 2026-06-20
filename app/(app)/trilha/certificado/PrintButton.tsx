'use client'
export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="px-4 py-2 bg-[#000FFF] text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors">
      🖨️ Imprimir / Salvar PDF
    </button>
  )
}
