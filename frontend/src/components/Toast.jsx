const STYLES = {
  succes: { fond: '#ecfdf5', bord: '#34d399', texte: '#065f46', icone: '✓' },
  erreur: { fond: '#fef2f2', bord: '#f87171', texte: '#991b1b', icone: '!' },
  info:   { fond: '#eff6ff', bord: '#60a5fa', texte: '#1e40af', icone: 'i' }
}

// Pile de notifications. Les erreurs sont annoncées tout de suite aux lecteurs d'écran (role="alert"),
// les autres messages poliment (role="status"). En bas d'écran, pleine largeur sur mobile.
export default function Toasts({ toasts, onFermer }) {
  return (
    <div className="fixed inset-x-2 bottom-2 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-96 z-[80] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => {
        const s = STYLES[t.type] ?? STYLES.info
        return (
          <div key={t.id} role={t.type === 'erreur' ? 'alert' : 'status'}
            className="pointer-events-auto flex items-start gap-3 rounded-xl p-3 shadow-lg text-sm"
            style={{ background: s.fond, border: `1px solid ${s.bord}`, color: s.texte }}>
            <span aria-hidden="true" className="font-bold w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0"
              style={{ background: s.bord, color: 'white' }}>{s.icone}</span>
            <p className="flex-1">{t.message}</p>
            <button type="button" onClick={() => onFermer(t.id)} aria-label="Fermer le message" className="font-bold px-1">✕</button>
          </div>
        )
      })}
    </div>
  )
}
