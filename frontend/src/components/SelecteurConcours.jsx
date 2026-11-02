import { CODES_CONCOURS, libelleConcours, couleurConcours } from '../lib/concours'

// Cases à cocher des concours (création / modification d'un élève ou d'un professeur)
export default function SelecteurConcours({ value, onChange, compact = false }) {
  const bascule = (code) =>
    onChange(value.includes(code) ? value.filter(c => c !== code) : [...value, code])

  return (
    <div className={`flex flex-wrap ${compact ? 'gap-1.5' : 'gap-2'}`}>
      {CODES_CONCOURS.map(code => {
        const actif = value.includes(code)
        const couleur = couleurConcours(code)
        return (
          <label key={code}
            className={`flex items-center gap-2 rounded-xl cursor-pointer select-none ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'} font-semibold`}
            style={{
              border: `1px solid ${actif ? couleur : '#f0ece0'}`,
              background: actif ? `${couleur}15` : 'white',
              color: actif ? couleur : '#6b7280'
            }}>
            <input type="checkbox" checked={actif} onChange={() => bascule(code)} />
            {libelleConcours(code)}
          </label>
        )
      })}
    </div>
  )
}
