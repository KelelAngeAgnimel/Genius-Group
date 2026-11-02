import { useEffect, useRef } from 'react'

// Boîte de confirmation accessible : Échap = annuler, Tab reste dans la boîte, le focus revient au bouton d'origine.
// Le bouton « Annuler » est actif par défaut quand l'action est destructrice (évite la validation par réflexe).
export default function ConfirmDialog({ titre, message, confirmer = 'Confirmer', annuler = 'Annuler', danger = false, onReponse }) {
  const boite = useRef(null)
  const boutonAnnuler = useRef(null)
  const boutonConfirmer = useRef(null)

  useEffect(() => {
    const precedent = document.activeElement
    ;(danger ? boutonAnnuler : boutonConfirmer).current?.focus()
    return () => precedent?.focus?.()
  }, [danger])

  const touche = (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); onReponse(false) }
    if (e.key === 'Tab') {
      const focalisables = boite.current.querySelectorAll('button')
      const premier = focalisables[0]
      const dernier = focalisables[focalisables.length - 1]
      if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus() }
      else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus() }
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" style={{ background: 'rgba(7,16,32,0.6)' }} onKeyDown={touche}>
      <div ref={boite} role="alertdialog" aria-modal="true" aria-labelledby="confirm-titre" aria-describedby="confirm-message"
        className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl">
        <h2 id="confirm-titre" className="font-bold text-lg" style={{ color: '#071020' }}>{titre}</h2>
        <p id="confirm-message" className="text-sm text-gray-600 mt-2 whitespace-pre-line">{message}</p>
        <div className="flex justify-end gap-2 mt-5">
          <button ref={boutonAnnuler} type="button" onClick={() => onReponse(false)}
            className="text-sm font-bold px-4 py-2 rounded-xl text-gray-600 bg-gray-100">{annuler}</button>
          <button ref={boutonConfirmer} type="button" onClick={() => onReponse(true)}
            className="text-sm font-bold px-4 py-2 rounded-xl text-white" style={{ background: danger ? '#C94C7B' : '#7B4CC9' }}>{confirmer}</button>
        </div>
      </div>
    </div>
  )
}
