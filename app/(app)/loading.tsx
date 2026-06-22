export default function Loading() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#000FFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '28px',
      }}
    >
      {/* Ícone girando — mix-blend-mode: screen remove o preto do PNG */}
      <img
        src="/bot-joao-icon1.png"
        alt="Bot João"
        style={{
          width: 90,
          height: 90,
          objectFit: 'contain',
          mixBlendMode: 'screen',
          animation: 'bjSpin 1.4s linear infinite',
        }}
      />

      {/* Bolinhas brancas */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[0, 180, 360].map((delay, i) => (
          <span
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.7)',
              display: 'inline-block',
              animation: `bjDot 1.2s ease-in-out infinite`,
              animationDelay: `${i * 200}ms`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes bjSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes bjDot {
          0%, 80%, 100% { transform: scale(0.5); opacity: 0.3; }
          40%            { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  )
}
