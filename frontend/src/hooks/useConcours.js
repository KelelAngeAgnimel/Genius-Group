import { useAuth } from '../context/AuthContext'
import { concoursDe, roleDeBase, peutAcceder, libelleUtilisateur } from '../lib/concours'

// Remplace les anciens helpers isEtudiantInphb / canAccessEsatic… d'AuthContext.
export function useConcours() {
  const { user } = useAuth()
  const concours = concoursDe(user)
  const role = roleDeBase(user?.role)
  return {
    concours,                                   // ['inphb', 'ensea']
    aConcours: (code) => concours.includes(code),
    peutAcceder: (valeurContenu) => peutAcceder(user, valeurContenu),
    libelle: libelleUtilisateur(user),
    estEtudiant: role === 'etudiant',
    estProfesseur: role === 'professeur',
    estAdmin: role === 'admin',
    estPersonnel: role === 'professeur' || role === 'admin'
  }
}
