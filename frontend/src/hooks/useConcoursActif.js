import { useSearchParams } from 'react-router-dom'
import { useConcours } from './useConcours'
import { CODES_CONCOURS } from '../lib/concours'

// Concours affiché sur une page « Mes progrès » : l'état est dans l'URL (?concours=ensea).
// Un code absent, inconnu ou non accessible retombe sur le premier concours de l'élève.
export function useConcoursActif() {
  const { peutAcceder } = useConcours()
  const [params, setParams] = useSearchParams()
  const codes = CODES_CONCOURS.filter(code => peutAcceder(code))
  const demande = params.get('concours')
  const actif = codes.includes(demande) ? demande : (codes[0] ?? null)
  // push (et non replace) : le bouton « Précédent » revient au concours précédent
  const choisir = (code) => setParams({ concours: code })
  return { codes, actif, choisir }
}
