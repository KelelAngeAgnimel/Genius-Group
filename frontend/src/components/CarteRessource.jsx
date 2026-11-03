import { useEffect, useRef, useState } from 'react'

// Carte de la Bibliothèque : bannière, titre dans la couleur du concours, sous-titre, badge optionnel et menu « ⋮ ».
// Toute la carte ouvre `onClick` ; le menu `actions` ([{ label, onClick }]) est un bouton à part.
export default function CarteRessource({ banniere, titre, sousTitre, couleur, badge, actions, onClick }) {
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
    <div ref={racine} className="relative bg-white rounded-2xl overflow-hidden transition-shadow hover:shadow-lg flex flex-col"
      style={{ border: '1px solid #f0ece0' }}>
      <button type="button" onClick={onClick} aria-label={`${titre}${sousTitre ? ` — ${sousTitre}` : ''}`}
        className="absolute inset-0 w-full h-full z-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C] rounded-2xl" />
      <div className="relative pointer-events-none">
        {banniere}
        {badge && (
          <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#C9A84C', color: '#071020' }}>
            {badge}
          </span>
        )}
      </div>
      <div className="relative pointer-events-none px-4 pt-3 pb-4 flex-1 pr-12">
        <p className="font-bold text-sm leading-snug" style={{ color: couleur }}>{titre}</p>
        {sousTitre && <p className="text-sm text-gray-600 mt-0.5">{sousTitre}</p>}
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
