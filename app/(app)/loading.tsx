export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      {/* Bot João pulsando */}
      <div style={{ animation: 'bjPulse 1.2s ease-in-out infinite' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/bot-joao-icon.png"
          alt="Bot João"
          width={80}
          height={80}
          style={{ width: 80, height: 80, objectFit: 'contain' }}
        />
      </div>

      {/* Bolinhas de carregamento */}
      <div className="flex gap-1.5 mt-5">
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#000FFF', display: 'inline-block', animation: 'bjDot 1.2s ease-in-out infinite', animationDelay: '0ms' }} />
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#000FFF', display: 'inline-block', animation: 'bjDot 1.2s ease-in-out infinite', animationDelay: '200ms' }} />
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#000FFF', display: 'inline-block', animation: 'bjDot 1.2s ease-in-out infinite', animationDelay: '400ms' }} />
      </div>

      <style>{`
        @keyframes bjPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.12); opacity: 0.85; }
        }
        @keyframes bjDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40%            { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
