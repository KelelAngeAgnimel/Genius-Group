import { useEffect, useRef, useState } from 'react'

// Carte à bannière : bannière, titre dans la couleur du concours, sous-titre, puis (tous facultatifs) :
//  - `badge`   : pastille dorée posée sur la bannière (ex. « Votre concours »)
//  - `children`: contenu libre sous le titre ; reste cliquable (liens, boutons) même quand la carte l'est
//  - `badges`  : [{ texte, alerte? }] en bas à gauche ; `action` : texte en bas à droite (« Accéder »…)
//  - `actions` : menu « ⋮ » ([{ label, onClick }]), bouton à part
// Avec `onClick`, toute la carte est un bouton ; sans, c'est une carte d'information.
export default function CarteRessource({ banniere, titre, sousTitre, couleur, badge, badges = [], action, actions, onClick, children }) {
  const [menuOuvert, setMenuOuvert] = useState(false)
  const racine = useRef(null)

  useEffect(() => {
    if (!menuOuvert) return
    const fermer = (e) => { if (e.type === 'keydown' ? e.key === 'Escape' : !racine.current?.contains(e.target)) setMenuOuvert(false) }
    document.addEventListener('mousedown', fermer)
    document.addEventListener('keydown', fermer)
    return () => { document.removeEventListener('mousedown', fermer); document.removeEventListener('keydown', fermer) }
  }, [menuOuvert])

  return (
    <div ref={racine} className={`relative bg-white rounded-2xl overflow-hidden transition-colors flex flex-col ${onClick ? 'hover:border-gray-400' : ''}`}
      style={{ border: '1px solid #f0ece0' }}>
      {onClick && (
        <button type="button" onClick={onClick} aria-label={`${titre}${sousTitre ? ` — ${sousTitre}` : ''}${action ? ` (${action})` : ''}`}
          className="absolute inset-0 w-full h-full z-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C] rounded-2xl" />
      )}
      <div className="relative pointer-events-none">
        {banniere}
        {badge && (
          <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#C9A84C', color: '#071020' }}>
            {badge}
          </span>
        )}
      </div>
      <div className={`relative flex-1 flex flex-col px-4 pt-3 pb-4 ${actions?.length > 0 ? 'pr-12' : ''}`}>
        <div className="pointer-events-none">
          <p className="font-bold text-sm leading-snug" style={{ color: couleur }}>{titre}</p>
          {sousTitre && <p className="text-sm text-gray-600 mt-0.5">{sousTitre}</p>}
        </div>
        {children && <div className="relative z-10 mt-3">{children}</div>}
        {(badges.length > 0 || action) && (
          <div className="pointer-events-none mt-auto pt-3 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {badges.map((b, i) => (
                <span key={i} className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={b.alerte
                    ? { background: 'rgba(201,76,123,0.08)', color: '#C94C7B', border: '1px solid rgba(201,76,123,0.3)' }
                    : { background: '#f3f4f6', color: '#4b5563' }}>
                  {b.texte}
                </span>
              ))}
            </div>
            {action && <span className="text-xs font-semibold underline underline-offset-4" style={{ color: '#8A6D1A' }}>{action}</span>}
          </div>
        )}
      </div>
      {actions?.length > 0 && (
        <div className="absolute bottom-2 right-2 z-10">
          <button type="button" aria-label={`Actions pour ${titre}`} aria-haspopup="menu" aria-expanded={menuOuvert}
            onClick={() => setMenuOuvert(o => !o)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 text-lg font-bold">
            ⋮
          </button>
          {menuOuvert && (
            <div role="menu" className="absolute right-0 bottom-10 w-52 bg-white rounded-xl shadow-xl py-1" style={{ border: '1px solid #f0ece0' }}>
              {actions.map(a => (
                <button key={a.label} type="button" role="menuitem" onClick={() => { setMenuOuvert(false); a.onClick() }}
                  className="block w-full text-left text-sm px-4 py-2 text-gray-700 hover:bg-gray-50">
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
