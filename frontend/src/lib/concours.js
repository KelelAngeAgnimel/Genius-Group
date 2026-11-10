// Concours : référentiel d'affichage + traduction des anciens rôles (comptes pas encore migrés).
// Le backend reste la source de vérité des droits ; ceci sert à l'affichage et au filtrage d'interface.

// guide : texte facultatif affiché dans Accueil > Guide (presentation, matieres, fonctionnement, preparation).
export const CONCOURS = {
  inphb:  { label: 'INP-HB', couleur: '#C9A84C', matieres: ['Culture Générale', 'Culture Scientifique', 'Culture Littéraire'], nom: 'Institut National Polytechnique Houphouët-Boigny', logo: 'https://inphb.edu.ci/wp-content/uploads/2020/03/INPHB.png', guide: { presentation: 'Concours d’entrée niveau BAC/BT à l’Institut National Polytechnique Félix Houphouët-Boigny, qui regroupe 8 grandes écoles (EPGE, ESI, ESCAE, ESTP, ESAS, ESMG, ESCPE et ESA). Il comporte deux phases : une admissibilité sur dossier, puis une composition écrite de 3H30.' } },
  esatic: { label: 'ESATIC', couleur: '#4C7BC9', matieres: ['Mathématiques', 'Physique', 'Anglais', 'Français'], nom: 'Ecole Supérieure Africaine des TIC', logo: 'https://esatic.ci/wp-content/uploads/2024/07/esatic_logo.jpg', guide: { presentation: 'Concours d’entrée de l’Ecole Supérieure Africaine des TIC, en classes préparatoires MP2I et en Licence 1 (SRIT, TWIN, ENTD).' } },
  cme:    { label: 'CME',    couleur: '#4CC9A8', matieres: ['Culture Générale', 'Culture Scientifique', 'Anglais', 'Français'], nom: 'Concours des Meilleurs Etudiants', logo: '/cme-logo.png', guide: { presentation: 'Concours des Meilleurs Etudiants : concours national destiné aux bacheliers.' } },
  // logo à déposer dans frontend/public ; à défaut, le sigle est affiché
  ensea:  { label: 'ENSEA',  couleur: '#7B4CC9', matieres: ['Français', 'Mathématiques'], nom: 'École Nationale Supérieure de Statistique et d’Économie Appliquée', logo: '/ensea-logo.png', guide: { presentation: 'École Nationale Supérieure de Statistique et d’Économie Appliquée d’Abidjan. Concours d’entrée du cycle Analyste Statisticien (AS), ouvert aux bacheliers des séries C, D, E ou S.', matieres: 'Français (résumé et dissertation) et Mathématiques', fonctionnement: 'Sur la plateforme, vous téléchargez les sujets, déposez votre copie scannée, que le professeur corrige (note sur 20 et commentaire), et remplissez une auto-évaluation après chaque séance. Un score de compétence est calculé pour chaque compétence.', preparation: 'La préparation se poursuit jusqu’à la date des épreuves écrites du concours.' } }
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

// Une note / un contenu (« INP-HB », « tous »…) concerne-t-il ce concours ?
export function viseConcours(valeur, code) {
  const cibles = codesDepuisContenu(valeur)
  return cibles === null || cibles.includes(code)
}
