import { Children } from 'react'

// Grille commune à toutes les pages qui affichent une carte par concours.
//  1 carte  : centrée, largeur limitée
//  2 cartes : 2 sur une ligne
//  3 cartes : 3 sur une ligne (dès `md`)
//  4 cartes : toujours 2 + 2 (jamais 3 + 1)
//  5 ou 6   : 3 par ligne, dernière ligne centrée
//  mobile   : 1 colonne. Les cartes d'une même ligne ont la même hauteur.
// Classes écrites en entier : Tailwind ne détecte pas celles construites à la volée.
const BASE = 'gap-5 [&>*]:min-w-0'
const DISPOSITIONS = {
  1: `grid grid-cols-1 max-w-md mx-auto ${BASE}`,
  2: `grid grid-cols-1 md:grid-cols-2 ${BASE}`,
  3: `grid grid-cols-1 md:grid-cols-3 ${BASE}`,
  4: `grid grid-cols-1 md:grid-cols-2 ${BASE}`
}
// Plus de 4 cartes : rangées de 3 en flex pour pouvoir centrer la dernière (2 gaps de 1.25rem)
const RANGEES_DE_3 = `flex flex-wrap justify-center ${BASE}`
const CASE_DE_3 = 'flex w-full md:w-[calc((100%-2.5rem)/3)] [&>*]:flex-1 [&>*]:min-w-0'

export default function GrilleConcours({ children, className = '' }) {
  const cartes = Children.toArray(children)
  const n = cartes.length
  if (n === 0) return null
  if (n <= 4) return <div className={`${DISPOSITIONS[n]} ${className}`}>{cartes}</div>
  return (
    <div className={`${RANGEES_DE_3} ${className}`}>
      {cartes.map((carte, i) => <div key={carte.key ?? i} className={CASE_DE_3}>{carte}</div>)}
    </div>
  )
}
