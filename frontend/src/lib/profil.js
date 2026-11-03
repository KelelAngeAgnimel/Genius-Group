// Profil de compétences d'un élève calculé à partir de ses notes (partagé par l'espace prof et l'espace élève).

// « Culture  Littéraire », « culture litteraire » → même clé
export const cleMatiere = (matiere) =>
  String(matiere ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

const moyenne = (valeurs) => (valeurs.length ? valeurs.reduce((s, v) => s + v, 0) / valeurs.length : 0)

// Couleur d'une note /20 : vert ≥ 14, or ≥ 10, rose sinon
export const couleurNote = (note) => (note >= 14 ? '#4CC9A8' : note >= 10 ? '#C9A84C' : '#C94C7B')

// Niveau d'après la moyenne convertie en pourcentage (note / 20 × 100)
export function niveauDepuisPourcentage(pct) {
  if (pct >= 85) return { libelle: 'ÉLITE', couleur: '#4CC9A8', fond: 'rgba(76,201,168,0.2)' }
  if (pct >= 70) return { libelle: 'AVANCÉ', couleur: '#C9A84C', fond: 'rgba(201,168,76,0.2)' }
  if (pct >= 55) return { libelle: 'INTERMÉD.', couleur: '#4C7BC9', fond: 'rgba(76,123,201,0.2)' }
  return { libelle: 'DÉBUTANT', couleur: '#C94C7B', fond: 'rgba(201,76,123,0.2)' }
}

// notes : [{ matiere, note }] → une ligne par matière (notes regroupées par matière normalisée)
export function profilDepuisNotes(notes) {
  const valides = (notes ?? []).filter(n => n && n.matiere && Number.isFinite(Number(n.note)))
  const groupes = new Map()
  for (const n of valides) {
    const cle = cleMatiere(n.matiere)
    if (!groupes.has(cle)) groupes.set(cle, { cle, matiere: String(n.matiere).trim().replace(/\s+/g, ' '), valeurs: [] })
    groupes.get(cle).valeurs.push(Number(n.note))
  }
  const matieres = [...groupes.values()].map(g => ({
    cle: g.cle,
    matiere: g.matiere,
    moyenne: moyenne(g.valeurs),
    nb: g.valeurs.length
  }))
  const moyenneGenerale = moyenne(valides.map(n => Number(n.note)))
  return {
    matieres,
    nbNotes: valides.length,
    moyenneGenerale,
    niveau: niveauDepuisPourcentage((moyenneGenerale / 20) * 100)
  }
}
