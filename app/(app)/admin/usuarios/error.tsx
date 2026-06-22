'use client'

import { useEffect } from 'react'

export default function AdminUsuariosError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[admin/usuarios] Error:', error.message, 'Digest:', error.digest)
  }, [error])

  return (
    <div className="p-6 max-w-xl mx-auto mt-10">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <h2 className="text-red-700 font-black text-lg mb-2">Erro ao carregar a página</h2>
        <p className="text-red-500 text-sm mb-1">
          {error.message || 'Ocorreu um erro inesperado.'}
        </p>
        {error.digest && (
          <p className="text-red-300 text-xs font-mono mb-4">Digest: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
