import { useSearchParams } from 'react-router-dom'
import { useConcours } from './useConcours'
import { CODES_CONCOURS } from '../lib/concours'

const CLE = 'progres.concours'
const lire = () => { try { return window.localStorage.getItem(CLE) } catch { return null } }
const ecrire = (code) => { try { window.localStorage.setItem(CLE, code) } catch { /* stockage indisponible : le choix vaut pour cette page */ } }

// Concours affiché sur une page « Mes progrès » : l'état est dans l'URL (?concours=ensea).
// Sans paramètre, on reprend le dernier concours choisi (partagé entre Notes, Suivi, Compétences, Planning),
// puis à défaut le premier concours de l'élève. Un code inconnu ou non accessible est ignoré.
export function useConcoursActif() {
  const { peutAcceder } = useConcours()
  const [params, setParams] = useSearchParams()
  const codes = CODES_CONCOURS.filter(code => peutAcceder(code))
  const choisi = [params.get('concours'), lire()].find(c => codes.includes(c))
  const actif = choisi ?? (codes[0] ?? null)
  // push (et non replace) : le bouton « Précédent » revient au concours précédent ; les autres paramètres sont conservés
  const choisir = (code) => {
    ecrire(code)
    setParams(precedents => { const p = new URLSearchParams(precedents); p.set('concours', code); return p })
  }
  return { codes, actif, choisir }
}
