import supabase from '../supabase.js'
import { LIBELLES } from './concours.js'
import { avecConcoursUn, optionsConcours } from './inscriptions.js'
import { elevesDuConcours } from './autoeval.js'
import { calculerScore, reglesScore, sousLeSeuil, NIVEAUX } from './score.js'

export const JOURS_ENTRE_ENVOIS = 7
const JOUR_MS = 24 * 3600 * 1000

const lire = async (requete) => {
  const { data, error } = await requete
  if (error) throw error
  return data ?? []
}
const memeId = (a, b) => String(a) === String(b)

// Paramètres du concours (α, seuil, mode) : options en base, sinon valeurs par défaut
export async function reglesDuConcours(code) {
  const options = await optionsConcours()
  return reglesScore(options[code])
}

// ─── Envoi d'un exercice de renforcement ────────────────────────────────────

// Premier exercice actif de la compétence que l'élève n'a pas encore reçu (du plus facile au plus difficile)
export async function exerciceNonRecu(etudiantId, competenceId, tousLesEnvois) {
  const envois = tousLesEnvois ?? await lire(supabase.from('exercices').select('*').eq('etudiant_id', etudiantId))
  const recus = new Set(envois.filter(e => e.renforcement_id).map(e => String(e.renforcement_id)))
  const biblio = (await lire(supabase.from('exercices_renforcement').select('*').eq('competence_id', competenceId)))
    .filter(e => e.actif && !recus.has(String(e.id)))
    .sort((a, b) => NIVEAUX.indexOf(a.niveau) - NIVEAUX.indexOf(b.niveau) || new Date(a.created_at ?? 0) - new Date(b.created_at ?? 0))
  return biblio[0] ?? null
}

// Dernier envoi de renforcement pour cette compétence dans les 7 derniers jours (ou null)
export function envoiRecent(envois, competenceId, maintenant = Date.now()) {
  return envois
    .filter(e => e.renforcement_id && memeId(e.competence_id, competenceId) && maintenant - new Date(e.created_at ?? 0).getTime() < JOURS_ENTRE_ENVOIS * JOUR_MS)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] ?? null
}

async function expediteurParDefaut() {
  const admin = (await lire(supabase.from('users').select('id').eq('role', 'admin')))[0]
  return admin?.id ?? null
}

// Envoie un exercice de renforcement : ligne dans `exercices` (suivi fait / pas fait) + message à l'élève.
// Retourne { envoye: true, exercice } ou { envoye: false, raison: 'deja_envoye' | 'aucun_exercice' | 'exercice_invalide' }.
export async function envoyerRenforcement({ etudiantId, competence, exerciceId = null, par = null, mode = 'manuel' }) {
  const envois = await lire(supabase.from('exercices').select('*').eq('etudiant_id', etudiantId))
  if (envoiRecent(envois, competence.id)) return { envoye: false, raison: 'deja_envoye' }

  let exercice
  if (exerciceId) {
    const [choisi] = await lire(supabase.from('exercices_renforcement').select('*').eq('id', exerciceId))
    if (!choisi || !choisi.actif || !memeId(choisi.competence_id, competence.id)) return { envoye: false, raison: 'exercice_invalide' }
    exercice = choisi
  } else {
    exercice = await exerciceNonRecu(etudiantId, competence.id, envois)
  }
  if (!exercice) return { envoye: false, raison: 'aucun_exercice' }

  const expediteur = par ?? exercice.created_by ?? await expediteurParDefaut()
  if (!expediteur) return { envoye: false, raison: 'aucun_exercice' }

  const { data, error } = await supabase.from('exercices').insert([{
    titre: `Renforcement ${competence.code} — ${exercice.titre}`,
    matiere: competence.matiere,
    description: competence.libelle,
    url_fichier: null,                       // le fichier reste dans le bucket privé (lien signé à la demande)
    etudiant_id: etudiantId,
    professeur_id: expediteur,
    competence_id: competence.id,
    renforcement_id: exercice.id,
    envoye_par_mode: mode,
    created_at: new Date().toISOString()
  }]).select().single()
  if (error) throw error

  // Notification : messagerie interne (affichée dans le tableau de bord de l'élève)
  const { error: errMessage } = await supabase.from('messages').insert([{
    de_id: expediteur,
    a_id: etudiantId,
    sujet: 'Exercice de renforcement',
    contenu: `Un exercice vous est proposé pour la compétence ${competence.code} (${competence.libelle}). Retrouvez-le dans « Mes compétences ».`
  }])
  if (errMessage) console.error('[renforcement] notification impossible', errMessage)

  return { envoye: true, exercice: data }
}

// ─── Recalcul des scores ────────────────────────────────────────────────────

// Recalcule tous les scores d'un élève (un par compétence ayant des données), met à jour l'historique
// et, si le concours est en mode AUTO, envoie un exercice pour chaque compétence sous le seuil.
// `declencher: false` : recalcul sans aucun envoi (ex. changement de paramètres en masse).
export async function recalculerEleve(etudiantId, { declencher = true } = {}) {
  const [brut] = await lire(supabase.from('users').select('id, role').eq('id', etudiantId))
  const eleve = await avecConcoursUn(brut)
  if (!eleve || eleve.role !== 'etudiant') return []

  const autoevals = await lire(supabase.from('auto_evaluations').select('*').eq('etudiant_id', eleve.id))
  const notes = await lire(supabase.from('notes').select('*').eq('etudiant_id', eleve.id))
  const anciens = await lire(supabase.from('scores_competences').select('*').eq('etudiant_id', eleve.id))
  const resultats = []

  for (const code of eleve.concours) {
    const competences = (await lire(supabase.from('competences').select('*').eq('concours_code', code))).filter(c => c.actif)
    if (competences.length === 0) continue
    const liens = await lire(supabase.from('notes_competences').select('*').eq('concours_code', code))
    const notesConcours = notes.filter(n => n.concours === LIBELLES[code])
    const regles = await reglesDuConcours(code)

    for (const competence of competences) {
      const calcul = calculerScore({
        autoevals: autoevals.filter(a => memeId(a.competence_id, competence.id)).map(a => ({ niveau: a.niveau, date: a.cree_le })),
        notes: notesConcours
          .filter(n => liens.some(l => memeId(l.competence_id, competence.id) && l.matiere === n.matiere && l.periode === n.periode))
          .map(n => ({ note: Number(n.note), date: n.created_at }))
      }, { alpha: regles.alpha })

      const ancien = anciens.find(s => memeId(s.competence_id, competence.id))
      if (!calcul) {
        if (ancien) await supabase.from('scores_competences').delete().eq('etudiant_id', eleve.id).eq('competence_id', competence.id)
        continue
      }

      const ligne = {
        score: calcul.score, provisoire: calcul.provisoire,
        nb_autoeval: calcul.nbAutoeval, nb_notes: calcul.nbNotes, calcule_le: new Date().toISOString()
      }
      if (ancien) {
        const { error } = await supabase.from('scores_competences').update(ligne).eq('etudiant_id', eleve.id).eq('competence_id', competence.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('scores_competences').insert([{ ...ligne, etudiant_id: eleve.id, competence_id: competence.id }])
        if (error && error.code !== '23505') throw error
      }
      if (!ancien || Number(ancien.score) !== calcul.score || ancien.provisoire !== calcul.provisoire) {
        const { error } = await supabase.from('scores_historique').insert([{
          etudiant_id: eleve.id, competence_id: competence.id, score: calcul.score, provisoire: calcul.provisoire, calcule_le: ligne.calcule_le
        }])
        if (error) throw error
      }

      let envoi = null
      if (declencher && regles.mode === 'auto' && sousLeSeuil(calcul, regles.seuil)) {
        try {
          envoi = await envoyerRenforcement({ etudiantId: eleve.id, competence, mode: 'auto' })
        } catch (err) {
          console.error('[renforcement] envoi automatique impossible', err)
        }
      }
      resultats.push({ competence, ...calcul, sousLeSeuil: sousLeSeuil(calcul, regles.seuil), envoi })
    }
  }
  return resultats
}

// Recalcul « de sécurité » appelé depuis les routes : une erreur de score ne doit jamais faire échouer
// l'enregistrement d'une note ou d'une auto-évaluation.
export async function recalculerSansBloquer(etudiantId, options) {
  try {
    return await recalculerEleve(etudiantId, options)
  } catch (err) {
    console.error('[score] recalcul impossible pour', etudiantId, err)
    return []
  }
}

// Recalcule tous les élèves d'un concours (après un changement de paramètres ou de rattachement de notes)
export async function recalculerConcours(code, options) {
  const eleves = await elevesDuConcours(code)
  for (const e of eleves) await recalculerSansBloquer(e.id, options)
  return eleves.length
}

// Rattache les notes d'une « évaluation de notes » (concours, matière, période) à des compétences,
// sans retirer les rattachements existants (utilisé pour les évaluations papier : leurs compétences sont connues).
export async function assurerRattachement({ concours, matiere, periode, competenceIds }) {
  if (competenceIds.length === 0) return
  const existants = await lire(supabase.from('notes_competences').select('*')
    .eq('concours_code', concours).eq('matiere', matiere).eq('periode', periode))
  const manquants = competenceIds.filter(id => !existants.some(l => memeId(l.competence_id, id)))
  if (manquants.length === 0) return
  const { error } = await supabase.from('notes_competences')
    .insert(manquants.map(competence_id => ({ concours_code: concours, matiere, periode, competence_id })))
  if (error && error.code !== '23505') throw error
}
