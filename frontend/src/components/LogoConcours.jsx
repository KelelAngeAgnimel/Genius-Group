import { useState } from 'react'
import { CONCOURS, libelleConcours, couleurConcours } from '../lib/concours'

// Logo d'un concours dans une pastille blanche arrondie, pour un rendu identique quel que soit le fichier
// (fond blanc rectangulaire ou fond transparent). Source unique : CONCOURS[code].logo.
// Si l'image est absente, on affiche le sigle dans la couleur du concours.
// `alt` : texte alternatif ; laisser vide quand le nom du concours est déjà écrit à côté.
export default function LogoConcours({ code, hauteur = 64, alt = '' }) {
  const [ko, setKo] = useState(false)
  const logo = CONCOURS[code]?.logo
  if (!logo || ko) {
    return <span style={{ fontSize: 34, fontWeight: 900, color: couleurConcours(code) }}>{libelleConcours(code)}</span>
  }
  return (
    <span className="inline-flex items-center justify-center bg-white rounded-xl shadow-sm"
      style={{ height: hauteur, padding: '8px 14px', maxWidth: '80%' }}>
      <img src={logo} alt={alt} onError={() => setKo(true)}
        style={{ height: '100%', width: 'auto', maxWidth: '100%', objectFit: 'contain' }} />
    </span>
  )
}
