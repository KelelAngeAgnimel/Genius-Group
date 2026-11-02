// Score de compétence (0–100) : fonctions pures, sans accès à la base (voir lib/renforcement.js pour le recalcul).
//
//   score = α × (moyenne auto-évaluation / 5 × 100) + (1 − α) × (moyenne des notes liées / 20 × 100)
//
// - Chaque moyenne porte sur les 5 DERNIÈRES mesures, pondérées 1 à 5 (la plus récente pèse le plus).
// - Sans aucune note rattachée : score = auto-évaluation seule, marqué « provisoire » (aucun envoi automatique).
// - Sans auto-évaluation : score = notes seules (non provisoire).
// - Sans aucune donnée : pas de score (null).

export const NB_MESURES = 5
export const ALPHA_DEFAUT = 0.3
export const SEUIL_DEFAUT = 50
export const MODES_RENFORCEMENT = ['auto', 'manuel']

const arrondi = (n) => Math.round(n * 100) / 100
const borne = (n, min, max) => Math.min(max, Math.max(min, n))

// Moyenne pondérée des `nb` dernières valeurs d'une liste classée de la plus ancienne à la plus récente.
// Poids : 1 pour la plus ancienne retenue, jusqu'à n pour la plus récente.
export function moyennePonderee(valeurs, nb = NB_MESURES) {
  const retenues = valeurs.slice(-nb)
  if (retenues.length === 0) return null
  let somme = 0
  let poids = 0
  retenues.forEach((v, i) => { somme += v * (i + 1); poids += i + 1 })
  return somme / poids
}

// Mesures classées par date croissante (à date égale, l'ordre d'arrivée est conservé)
const chronologique = (mesures) =>
  mesures
    .map((m, i) => ({ ...m, i, t: new Date(m.date ?? 0).getTime() || 0 }))
    .sort((a, b) => a.t - b.t || a.i - b.i)

// autoevals : [{ niveau: 0..5, date }]   notes : [{ note: 0..20, date }]
export function calculerScore({ autoevals = [], notes = [] }, { alpha = ALPHA_DEFAUT } = {}) {
  const a = borne(Number.isFinite(alpha) ? alpha : ALPHA_DEFAUT, 0, 1)
  const niveaux = chronologique(autoevals).map(m => borne(Number(m.niveau), 0, 5)).filter(Number.isFinite)
  const points = chronologique(notes).map(m => borne(Number(m.note), 0, 20)).filter(Number.isFinite)

  const partAuto = moyennePonderee(niveaux)
  const partNotes = moyennePonderee(points)
  const base = { nbAutoeval: niveaux.length, nbNotes: points.length }

  if (partAuto === null && partNotes === null) return null
  const sur100Auto = partAuto === null ? null : (partAuto / 5) * 100
  const sur100Notes = partNotes === null ? null : (partNotes / 20) * 100

  if (sur100Notes === null) return { score: arrondi(sur100Auto), provisoire: true, ...base }
  if (sur100Auto === null) return { score: arrondi(sur100Notes), provisoire: false, ...base }
  return { score: arrondi(a * sur100Auto + (1 - a) * sur100Notes), provisoire: false, ...base }
}

// Paramètres d'un concours : options de la table `concours`, sinon valeurs par défaut (α = 0,3 ; seuil = 50)
export function reglesScore(options) {
  options = options ?? {}
  // null, '' ou absent → valeur par défaut (Number(null) vaudrait 0)
  const nombre = (v, defaut) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? defaut : Number(v))
  return {
    alpha: borne(nombre(options.score_alpha, ALPHA_DEFAUT), 0, 1),
    seuil: borne(nombre(options.score_seuil, SEUIL_DEFAUT), 0, 100),
    mode: MODES_RENFORCEMENT.includes(options.renforcement_mode) ? options.renforcement_mode : 'manuel'
  }
}

// Un score déclenche le renforcement s'il est définitif (non provisoire) et STRICTEMENT sous le seuil
export const sousLeSeuil = (resultat, seuil) =>
  !!resultat && !resultat.provisoire && resultat.score < seuil

export const NIVEAUX = ['facile', 'moyen', 'difficile']
