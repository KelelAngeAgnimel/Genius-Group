// Notation 0 à 5 : 5 étoiles cliquables + bouton « 0 » (aucune maîtrise)
export default function Etoiles({ value, onChange, disabled = false }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Niveau de 0 à 5">
      <button type="button" disabled={disabled} onClick={() => onChange(0)} aria-label="0 — pas du tout maîtrisé"
        className="text-xs font-bold w-7 h-7 rounded-full transition disabled:opacity-50"
        style={{
          background: value === 0 ? '#C94C7B' : 'white',
          color: value === 0 ? 'white' : '#9ca3af',
          border: `1px solid ${value === 0 ? '#C94C7B' : '#e5e7eb'}`
        }}>0</button>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" disabled={disabled} onClick={() => onChange(n)}
          aria-label={`${n} sur 5`} aria-pressed={value !== null && value >= n}
          className="text-2xl leading-none transition disabled:opacity-50"
          style={{ color: value !== null && value >= n ? '#C9A84C' : '#e5e7eb' }}>★</button>
      ))}
      <span className="text-xs text-gray-500 ml-2 w-8">{value === null ? '—' : `${value}/5`}</span>
    </div>
  )
}
