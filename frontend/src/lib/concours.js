// Concours : référentiel d'affichage + traduction des anciens rôles (comptes pas encore migrés).
// Le backend reste la source de vérité des droits ; ceci sert à l'affichage et au filtrage d'interface.

export const CONCOURS = {
  inphb:  { label: 'INP-HB', couleur: '#C9A84C', nom: 'Institut National Polytechnique Houphouët-Boigny', logo: 'https://inphb.edu.ci/wp-content/uploads/2020/03/INPHB.png' },
  esatic: { label: 'ESATIC', couleur: '#4C7BC9', nom: 'Ecole Supérieure Africaine des TIC', logo: 'https://esatic.ci/wp-content/uploads/2024/07/esatic_logo.jpg' },
  cme:    { label: 'CME',    couleur: '#4CC9A8', nom: 'Concours des Meilleurs Etudiants', logo: '/cme-logo.png' },
  // logo à déposer dans frontend/public ; à défaut, le sigle est affiché
  ensea:  { label: 'ENSEA',  couleur: '#7B4CC9', nom: 'École Nationale Supérieure de Statistique et d’Économie Appliquée', logo: '/ensea-logo.png' }
}
export const CODES_CONCOURS = Object.keys(CONCOURS)

const ROLES_ANCIENS = {
  etudiant_inphb: ['inphb'],
  etudiant_esatic: ['esatic'],
  etudiant_cme: ['cme'],
  etudiant_inphb_cme: ['inphb', 'cme'],
  etudiant_esatic_cme: ['esatic', 'cme'],
  etudiant_both: ['inphb', 'esatic'],
  etudiant_all: ['inphb', 'esatic', 'cme']
}

export const roleDeBase = (role) => (typeof role === 'string' && role.startsWith('etudiant') ? 'etudiant' : role)

// Liste des concours d'un utilisateur (champ `concours`, sinon déduite d'un ancien rôle)
export function concoursDe(user) {
  if (!user) return []
  if (Array.isArray(user.concours)) return user.concours
  return [...(ROLES_ANCIENS[user.role] ?? [])]
}

export const libelleConcours = (code) => CONCOURS[code]?.label ?? String(code).toUpperCase()
export const couleurConcours = (code) => CONCOURS[code]?.couleur ?? '#9ca3af'

// « INP-HB + ESATIC » pour un élève ; « Professeur » / « Admin » pour le personnel
export function libelleUtilisateur(user) {
  if (!user) return ''
  const role = roleDeBase(user.role)
  if (role === 'admin') return 'Admin'
  const concours = concoursDe(user).map(libelleConcours).join(' + ')
  if (role === 'professeur') return concours ? `Professeur — ${concours}` : 'Professeur'
  return concours || 'Sans concours'
}

// Valeur stockée sur un contenu (« INP-HB », « esatic », « tous »…) → liste de codes, ou null = pour tous
export function codesDepuisContenu(valeur) {
  const v = String(valeur ?? '').toLowerCase().replace(/[\s_-]/g, '')
  if (['', 'tous', 'all', 'both', 'aucun'].includes(v)) return null
  return CODES_CONCOURS.filter(c => v.includes(c) || (c === 'inphb' && v.includes('inp')))
}

// Mêmes règles que lib/concours.js côté backend
export function peutAcceder(user, valeurContenu) {
  if (!user) return false
  const role = roleDeBase(user.role)
  if (role === 'admin') return true
  const cibles = codesDepuisContenu(valeurContenu)
  if (cibles === null) return true
  const miens = concoursDe(user)
  if (role === 'professeur' && miens.length === 0) return true
  return cibles.some(c => miens.includes(c))
}

// Libellé d'une valeur de contenu (« tous », « inp-hb + esatic »…), ENSEA compris
export function libelleContenu(valeur) {
  const cibles = codesDepuisContenu(valeur)
  if (cibles === null) return 'Tous les concours'
  return cibles.length ? cibles.map(libelleConcours).join(' + ') : String(valeur)
}
