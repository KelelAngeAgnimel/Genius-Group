import { cleMatiere } from './profil'

// Format d'une ressource (colonne `type` : pdf, video, exercice, lien)
export const TYPES = {
  pdf:      { label: 'PDF',      couleur: '#C9A84C', icone: 'fichier' },
  video:    { label: 'Vidéo',    couleur: '#4C7BC9', icone: 'video' },
  exercice: { label: 'Exercice', couleur: '#C94C7B', icone: 'crayon' },
  lien:     { label: 'Lien',     couleur: '#4CC9A8', icone: 'lien' }
}
export const typeDe = (type) => TYPES[type] ?? { label: type || 'Document', couleur: '#9ca3af', icone: 'fichier' }

// « Mathématiques » → « mathematiques » ; « Culture Générale » → « culture-generale »
export const slugMatiere = (matiere) => cleMatiere(matiere).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// Icône d'une matière (voir components/Banniere.jsx)
export function iconeMatiere(matiere) {
  const m = cleMatiere(matiere)
  if (m.includes('math')) return 'math'
  if (m.includes('phys')) return 'atome'
  if (m.includes('scient')) return 'fiole'
  if (m.includes('angl')) return 'globe'
  if (m.includes('franc')) return 'bulle'
  if (m.includes('general')) return 'colonnes'
  return 'livre'
}

export const NOUVEAU_JOURS = 7
export const estNouveau = (creeLe, maintenant = Date.now()) => {
  const t = new Date(creeLe).getTime()
  return Number.isFinite(t) && maintenant - t < NOUVEAU_JOURS * 86400_000 && t <= maintenant + 86400_000
}

export const TRIS = [
  { value: 'recent', label: 'Plus récent' },
  { value: 'nom', label: 'Nom (A → Z)' }
]

// Recherche (titre, description, auteur ; sans accents ni casse), filtre de type, tri
export function filtrerDocuments(documents, { recherche = '', type = 'tous', tri = 'recent' } = {}) {
  const q = cleMatiere(recherche)
  const liste = documents.filter(d => {
    if (type !== 'tous' && d.type !== type) return false
    if (!q) return true
    const auteur = d.professeur ? `${d.professeur.prenom ?? ''} ${d.professeur.nom ?? ''} ${d.professeur.username ?? ''}` : ''
    return cleMatiere(`${d.titre} ${d.description ?? ''} ${auteur}`).includes(q)
  })
  return liste.sort(tri === 'nom'
    ? (a, b) => a.titre.localeCompare(b.titre, 'fr', { sensitivity: 'base' })
    : (a, b) => new Date(b.created_at) - new Date(a.created_at))
}
