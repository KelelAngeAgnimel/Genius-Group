import supabase from '../supabase.js'
import { OPTIONS_PAR_DEFAUT, concoursDeLUtilisateur, codesDepuisContenu } from './concours.js'
import { optionsConcours, avecConcours } from './inscriptions.js'

const HEURE = 3600 * 1000

// Règles d'auto-évaluation d'un concours : options de la table `concours`, sinon valeurs par défaut.
// Hors ENSEA, rien n'est bloquant tant qu'un administrateur ne l'a pas activé.
export function reglesAutoEval(optionsParCode, code) {
  const o = { ...OPTIONS_PAR_DEFAUT[code], ...(optionsParCode?.[code] ?? {}) }
  return {
    bloquante: o.autoeval_bloquante === true,
    delaiH: Number(o.autoeval_delai_heures ?? 48),
    rappelH: Number(o.autoeval_rappel_heures ?? 24)
  }
}

// État d'une séance pour un élève.
//  a_venir        : la séance n'est pas terminée
//  sans_competence: rien à évaluer
//  faite          : toutes les compétences ont une réponse
//  en_attente     : à remplir. `rappel` dès `rappelH` après la fin ; `verrouille` à `delaiH` si bloquante
//                   et pas de déblocage manuel
export function etatSeance({ fin, nbCompetences, nbReponses, debloque }, regles, maintenant = Date.now()) {
  const finMs = new Date(fin).getTime()
  if (finMs > maintenant) return { etat: 'a_venir' }
  if (nbCompetences === 0) return { etat: 'sans_competence' }
  if (nbReponses >= nbCompetences) return { etat: 'faite' }
  const echeance = finMs + regles.delaiH * HEURE
  return {
    etat: 'en_attente',
    echeance: new Date(echeance).toISOString(),
    rappel: maintenant >= finMs + regles.rappelH * HEURE,
    verrouille: regles.bloquante && maintenant >= echeance && !debloque,
    debloque: !!debloque,
    bloquante: regles.bloquante
  }
}

const lire = async (requete) => {
  const { data, error } = await requete
  if (error) throw error
  return data ?? []
}

// Séances des concours de l'élève avec leurs compétences, ses réponses et son état
export async function statutsEleve(user, maintenant = Date.now()) {
  const mesConcours = concoursDeLUtilisateur(user)
  if (mesConcours.length === 0) return []

  const seances = (await lire(supabase.from('seances').select('*'))).filter(s => mesConcours.includes(s.concours_code))
  if (seances.length === 0) return []
  const ids = seances.map(s => s.id)

  const liens = await lire(supabase.from('seance_competences').select('seance_id, competence_id').in('seance_id', ids))
  const competences = await lire(supabase.from('competences').select('*').in('id', [...new Set(liens.map(l => l.competence_id))]))
  const reponses = await lire(supabase.from('auto_evaluations').select('*').eq('etudiant_id', user.id))
  const deblocages = await lire(supabase.from('autoeval_deblocages').select('*').eq('etudiant_id', user.id))
  const options = await optionsConcours()

  return seances.map(seance => {
    const comps = liens
      .filter(l => String(l.seance_id) === String(seance.id))
      .map(l => competences.find(c => String(c.id) === String(l.competence_id)))
      .filter(Boolean)
      .sort((a, b) => a.matiere.localeCompare(b.matiere) || a.ordre - b.ordre)
      .map(c => ({
        id: c.id, code: c.code, libelle: c.libelle, matiere: c.matiere,
        niveau: reponses.find(r => String(r.seance_id) === String(seance.id) && String(r.competence_id) === String(c.id))?.niveau ?? null
      }))
    const etat = etatSeance({
      fin: seance.fin,
      nbCompetences: comps.length,
      nbReponses: comps.filter(c => c.niveau !== null).length,
      debloque: deblocages.some(d => String(d.seance_id) === String(seance.id))
    }, reglesAutoEval(options, seance.concours_code), maintenant)
    return {
      seance: { id: seance.id, titre: seance.titre, debut: seance.debut, fin: seance.fin, concours_code: seance.concours_code },
      competences: comps,
      ...etat
    }
  })
}

// Concours pour lesquels l'élève est verrouillé (auto-évaluation en retard). Un seul calcul par requête.
export async function concoursVerrouilles(user, maintenant = Date.now()) {
  if (user.role !== 'etudiant') return new Set()
  const statuts = await statutsEleve(user, maintenant)
  return new Set(statuts.filter(s => s.verrouille).map(s => s.seance.concours_code))
}

// Ce contenu (lien de cours, ressource) est-il verrouillé ? Ne concerne que les contenus qui ciblent
// explicitement un concours (un contenu « tous » n'est jamais verrouillé).
export function estVerrouille(verrouilles, valeurContenu) {
  if (verrouilles.size === 0) return false
  const cibles = codesDepuisContenu(valeurContenu)
  return !!cibles && cibles.some(c => verrouilles.has(c))
}

export const contenuVerrouille = async (user, valeurContenu, maintenant = Date.now()) =>
  estVerrouille(await concoursVerrouilles(user, maintenant), valeurContenu)

export const MESSAGE_VERROUILLE =
  'Remplissez votre auto-évaluation de la séance précédente pour accéder à ce contenu.'

// Élèves inscrits à un concours (avec leurs concours), triés par nom
export async function elevesDuConcours(code) {
  const eleves = await lire(
    supabase.from('users').select('id, matricule, username, nom, prenom, role').like('role', 'etudiant%')
  )
  return (await avecConcours(eleves)).filter(e => e.concours.includes(code))
}
