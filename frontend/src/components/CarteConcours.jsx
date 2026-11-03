import { useState } from 'react'
import { CONCOURS, libelleConcours, couleurConcours } from '../lib/concours'

// Carte d'un concours : un seul style pour Évaluations, Ressources et Mes progrès.
// `badges` : [{ texte, alerte? }] affichés sous le titre ; `onClick` ouvre le concours.
export default function CarteConcours({ code, description, detail, badges = [], onClick }) {
  const couleur = couleurConcours(code)
  const sigle = libelleConcours(code)
  const [logoKo, setLogoKo] = useState(false)
  const logo = CONCOURS[code]?.logo

  return (
    <button type="button" onClick={onClick}
      aria-label={`${sigle}${description ? ` — ${description}` : ''}`}
      className="text-left rounded-2xl overflow-hidden transition-transform duration-200 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C] w-full"
      style={{ background: 'linear-gradient(135deg, #071020, #0d1f3c)', border: `2px solid ${couleur}40`, cursor: 'pointer' }}>
      <div className="flex items-center justify-center py-8 px-6" style={{ minHeight: 140 }}>
        {logo && !logoKo
          ? <img src={logo} alt="" onError={() => setLogoKo(true)}
              style={{ maxHeight: 90, maxWidth: 180, objectFit: 'contain' }} />
          : <span style={{ fontSize: 38, fontWeight: 900, color: couleur }}>{sigle}</span>}
      </div>
      <div className="h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${couleur}, transparent)` }} />
      <div className="px-5 py-4">
        <p className="font-bold text-sm text-white">{sigle}</p>
        {description && <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{description}</p>}
        <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {detail && <span className="text-xs" style={{ color: '#9ca3af' }}>{detail}</span>}
            {badges.map((b, i) => (
              <span key={i} className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={b.alerte
                  ? { background: 'rgba(201,76,123,0.18)', color: '#f08ab0', border: '1px solid rgba(201,76,123,0.4)' }
                  : { background: `${couleur}25`, color: couleur }}>
                {b.texte}
              </span>
            ))}
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-lg" style={{ background: `${couleur}20`, color: couleur }}>
            Accéder →
          </span>
        </div>
      </div>
    </button>
  )
}
