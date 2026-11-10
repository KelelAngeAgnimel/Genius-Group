import { useState } from 'react'
import { CONCOURS, libelleConcours } from '../lib/concours'

// Carte d'un concours : un seul style pour Évaluations, Ressources et Mes progrès.
// `badges` : [{ texte, alerte? }] affichés sous le titre ; `onClick` ouvre le concours.
export default function CarteConcours({ code, description, detail, badges = [], onClick }) {
  const sigle = libelleConcours(code)
  const [logoKo, setLogoKo] = useState(false)
  const logo = CONCOURS[code]?.logo

  return (
    <button type="button" onClick={onClick}
      aria-label={`${sigle}${description ? ` — ${description}` : ''}`}
      className="text-left bg-white rounded-2xl overflow-hidden transition-colors hover:border-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C] w-full"
      style={{ border: '1px solid #e5e7eb', cursor: 'pointer' }}>
      <div className="flex items-center justify-center py-8 px-6" style={{ minHeight: 140 }}>
        {logo && !logoKo
          ? <img src={logo} alt="" onError={() => setLogoKo(true)}
              style={{ maxHeight: 90, maxWidth: 180, objectFit: 'contain' }} />
          : <span style={{ fontSize: 34, fontWeight: 700, color: '#071020' }}>{sigle}</span>}
      </div>
      <div className="px-5 py-4" style={{ borderTop: '1px solid #e5e7eb' }}>
        <p className="font-bold text-sm" style={{ color: '#071020' }}>{sigle}</p>
        {description && <p className="text-xs mt-0.5 text-gray-500">{description}</p>}
        <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {detail && <span className="text-xs text-gray-500">{detail}</span>}
            {badges.map((b, i) => (
              <span key={i} className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={b.alerte
                  ? { background: 'rgba(201,76,123,0.08)', color: '#C94C7B', border: '1px solid rgba(201,76,123,0.3)' }
                  : { background: '#f3f4f6', color: '#4b5563' }}>
                {b.texte}
              </span>
            ))}
          </div>
          <span className="text-xs font-semibold underline underline-offset-4" style={{ color: '#8A6D1A' }}>
            Accéder
          </span>
        </div>
      </div>
    </button>
  )
}
