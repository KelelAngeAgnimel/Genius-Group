import { libelleConcours, couleurConcours } from '../lib/concours'

// Onglets de concours. Rien n'est affiché quand il n'y a qu'un seul concours.
export default function SelecteurConcours({ codes, actif, onChoisir }) {
  if (codes.length <= 1) return null
  return (
    <div role="tablist" aria-label="Concours" className="flex gap-2 flex-wrap mb-5">
      {codes.map(code => {
        const selectionne = code === actif
        const couleur = couleurConcours(code)
        return (
          <button key={code} type="button" role="tab" aria-selected={selectionne} onClick={() => onChoisir(code)}
            className="px-4 py-2 rounded-xl text-xs font-bold transition"
            style={{
              background: selectionne ? '#071020' : '#fff',
              color: selectionne ? couleur : '#6b7280',
              border: `1px solid ${selectionne ? couleur : '#f0ece0'}`
            }}>
            {libelleConcours(code)}
          </button>
        )
      })}
    </div>
  )
}
