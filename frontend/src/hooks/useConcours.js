import { useEffect, useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import { concoursDe, roleDeBase, peutAcceder, libelleUtilisateur } from '../lib/concours'

// Options par défaut si /api/concours est indisponible (ENSEA : pas de génération automatique de tests)
const OPTIONS_PAR_DEFAUT = { ensea: { generation_auto_tests: false } }

// Référentiel partagé entre tous les composants : un seul appel par session
let referentiel = null
let chargement = null
function chargerReferentiel() {
  if (!chargement) {
    chargement = api.get('/api/concours')
      .then(res => {
        referentiel = res.ok
          ? Object.fromEntries((res.data.concours ?? []).map(c => [c.code, c.options ?? {}]))
          : {}
        return referentiel
      })
      .catch(() => { chargement = null; return {} })
  }
  return chargement
}

// Remplace les anciens helpers isEtudiantInphb / canAccessEsatic… d'AuthContext.
export function useConcours() {
  const { user, token } = useAuth()
  const [options, setOptions] = useState(referentiel)

  useEffect(() => {
    if (!token || referentiel) return
    let actif = true
    chargerReferentiel().then(o => { if (actif) setOptions(o) })
    return () => { actif = false }
  }, [token])

  const concours = concoursDe(user)
  const role = roleDeBase(user?.role)
  const option = (code, nom) => (options?.[code] ?? OPTIONS_PAR_DEFAUT[code])?.[nom]
  const generationAutoTests = (code) => option(code, 'generation_auto_tests') !== false

  return {
    concours,                                   // ['inphb', 'ensea']
    aConcours: (code) => concours.includes(code),
    peutAcceder: (valeurContenu) => peutAcceder(user, valeurContenu),
    option,
    generationAutoTests,                        // (code) => bool
    // Quiz générés automatiquement : un élève dont TOUS les concours les excluent (ex. ENSEA seul) n'a pas la page
    peutVoirQuiz: role !== 'etudiant' || concours.length === 0 || concours.some(generationAutoTests),
    libelle: libelleUtilisateur(user),
    estEtudiant: role === 'etudiant',
    estProfesseur: role === 'professeur',
    estAdmin: role === 'admin',
    estPersonnel: role === 'professeur' || role === 'admin'
  }
}
