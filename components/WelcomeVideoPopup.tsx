'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'hub_somar_welcome_seen'

export default function WelcomeVideoPopup() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY)
    if (!seen) setOpen(true)
  }, [])

  function close() {
    localStorage.setItem(STORAGE_KEY, '1')
    setOpen(false)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={close}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#000FFF] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-black text-gray-900">Bem-vindo ao HUB Somar!</p>
              <p className="text-xs text-gray-400">Assista ao vídeo de apresentação</p>
            </div>
          </div>
          <button
            onClick={close}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Fechar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Vídeo */}
        <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src="https://www.youtube-nocookie.com/embed/Cpw2eXnaOoc?autoplay=1&mute=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&controls=1"
            title="Apresentação HUB Somar"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
          {/* Cobre o overlay de título/canal do YouTube (faixa preta no topo) */}
          <div
            className="absolute top-0 left-0 right-0 pointer-events-none"
            style={{ height: '72px', background: 'linear-gradient(to bottom, #000 60%, transparent)' }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50/70">
          <p className="text-xs text-gray-400">Você pode rever esse vídeo a qualquer momento nas configurações.</p>
          <button
            onClick={close}
            className="px-5 py-2 bg-[#000FFF] text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Começar
          </button>
        </div>
      </div>
    </div>
  )
}
