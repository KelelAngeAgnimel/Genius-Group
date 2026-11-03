import express from 'express'
import multer from 'multer'
import { z } from 'zod'
import supabase from '../supabase.js'
import { verifyToken, requireRole } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validate.js'
import { peutAcceder, peutPublierPour, peutGererEleve, CODES_CONCOURS } from '../lib/concours.js'
import { elevesDuConcours } from '../lib/autoeval.js'
import { NIVEAUX, sousLeSeuil } from '../lib/score.js'
import { envoyerRenforcement, envoiRecent, exerciceNonRecu, reglesDuConcours, recalculerConcours } from '../lib/renforcement.js'
import {
  LIMITES, detecterType, fusionnerEnPdf, urlSignee, deposerPdf, supprimerFichiers, FichierInvalide
} from '../lib/fichiers.js'

const router = express.Router()
const BUCKET = 'exercices_renforcement'

const message = (res, statut, texte) => res.status(statut).json({ message: texte, error: texte })
const uuid = z.string().uuid()
const lire = async (requete) => {
  const { data, error } = await requete
  if (error) throw error
  return data ?? []
}
const memeId = (a, b) => String(a) === String(b)
const controleId = (req, res, next) =>
  uuid.safeParse(req.params.id).success ? next() : message(res, 400, 'Identifiant invalide')

// Réception d'un fichier en mémoire (PDF, JPG ou PNG — converti en PDF), 15 Mo maximum
const televerser = multer({ storage: multer.memoryStorage(), limits: { fileSize: LIMITES.octetsParFichier, files: 1 } })
const recevoir = (req, res, next) => {
  televerser.single('fichier')(req, res, (err) => {
    if (!err) return next()
    if (err instanceof multer.MulterError) return message(res, 400, 'Fichier invalide ou trop volumineux (15 Mo maximum)')
    next(err)
  })
}

// ═══ PROFESSEURS : bibliothèque d'exercices de renforcement ═════════════════

const creerSchema = z.object({
  competence_id: uuid,
  titre: z.string().trim().min(1).max(200),
  niveau: z.enum(NIVEAUX).default('moyen')
})
const modifierSchema = z.object({
  titre: z.string().trim().min(1).max(200).optional(),
  niveau: z.enum(NIVEAUX).optional(),
  actif: z.boolean().optional()
})

// GET /api/renforcement/exercices?concours=ensea
router.get('/exercices', verifyToken, requireRole('professeur', 'admin'), async (req, res) => {
  const concours = CODES_CONCOURS.includes(req.query.concours) ? req.query.concours : null
  const exercices = (await lire(supabase.from('exercices_renforcement').select('*')))
    .filter(e => (!concours || e.concours_code === concours) && peutAcceder(req.user, e.concours_code))
  const competences = await lire(supabase.from('competences').select('id, code, libelle, matiere'))
  res.json({
    exercices: exercices
      .map(({ fichier_path, ...e }) => ({ ...e, competence: competences.find(c => memeId(c.id, e.competence_id)) ?? null })) // eslint-disable-line no-unused-vars
      .sort((a, b) => (a.competence?.code ?? '').localeCompare(b.competence?.code ?? '') || NIVEAUX.indexOf(a.niveau) - NIVEAUX.indexOf(b.niveau))
  })
})

// POST /api/renforcement/exercices — ajoute un exercice (fichier PDF, JPG ou PNG)
router.post('/exercices', verifyToken, requireRole('professeur', 'admin'), recevoir, validate(creerSchema), async (req, res) => {
  const v = req.body
  const [competence] = await lire(supabase.from('competences').select('*').eq('id', v.competence_id))
  if (!competence || !competence.actif) return message(res, 400, 'Compétence invalide')
  if (!peutPublierPour(req.user, competence.concours_code)) return message(res, 403, 'Vous ne pouvez gérer que les exercices de vos concours')
  if (!req.file) return message(res, 400, 'Joignez le fichier de l’exercice (PDF, JPG ou PNG)')

  let pdf
  try {
    const type = detecterType(req.file.buffer)
    if (!type) return message(res, 400, 'Le fichier doit être un PDF, JPG ou PNG valide')
    pdf = await fusionnerEnPdf([{ buffer: req.file.buffer, type }])
  } catch (err) {
    if (err instanceof FichierInvalide) return message(res, 400, err.message)
    throw err
  }

  const chemin = `${competence.concours_code}/${competence.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`
  await deposerPdf(BUCKET, chemin, pdf)
  const { data, error } = await supabase.from('exercices_renforcement').insert([{
    concours_code: competence.concours_code, competence_id: competence.id, titre: v.titre, fichier_path: chemin,
    niveau: v.niveau, actif: true, created_by: req.user.id, created_at: new Date().toISOString()
  }]).select().single()
  if (error) { await supprimerFichiers(BUCKET, [chemin]); throw error }
  const { fichier_path, ...publique } = data // eslint-disable-line no-unused-vars
  res.status(201).json({ exercice: publique })
})

// PATCH /api/renforcement/exercices/:id — titre, niveau, activation
router.patch('/exercices/:id', verifyToken, requireRole('professeur', 'admin'), controleId, validate(modifierSchema), async (req, res) => {
  const [exercice] = await lire(supabase.from('exercices_renforcement').select('*').eq('id', req.params.id))
  if (!exercice || !peutAcceder(req.user, exercice.concours_code)) return message(res, 404, 'Exercice introuvable')
  const updates = {}
  for (const k of ['titre', 'niveau', 'actif']) if (req.body[k] !== undefined) updates[k] = req.body[k]
  if (Object.keys(updates).length === 0) return message(res, 400, 'Aucune modification fournie')
  const { error } = await supabase.from('exercices_renforcement').update(updates).eq('id', exercice.id)
  if (error) throw error
  res.json({ success: true })
})

// GET /api/renforcement/exercices/:id/fichier — lien signé de 5 minutes (personnel)
router.get('/exercices/:id/fichier', verifyToken, requireRole('professeur', 'admin'), controleId, async (req, res) => {
  const [exercice] = await lire(supabase.from('exercices_renforcement').select('*').eq('id', req.params.id))
  if (!exercice || !peutAcceder(req.user, exercice.concours_code)) return message(res, 404, 'Exercice introuvable')
  res.json(await urlSignee(BUCKET, exercice.fichier_path))
})

// ═══ PROFESSEURS : élèves en difficulté ═════════════════════════════════════

// GET /api/renforcement/difficultes?concours=ensea — scores définitifs sous le seuil, du plus bas au plus haut
router.get('/difficultes', verifyToken, requireRole('professeur', 'admin'), async (req, res) => {
  const concours = z.enum(CODES_CONCOURS).safeParse(req.query.concours ?? 'ensea')
  if (!concours.success) return message(res, 400, 'Concours invalide')
  const code = concours.data
  if (!peutAcceder(req.user, code)) return message(res, 403, 'Accès refusé')

  const regles = await reglesDuConcours(code)
  const eleves = (await elevesDuConcours(code)).filter(e => peutGererEleve(req.user, e))
  const ids = eleves.map(e => e.id)
  if (ids.length === 0) return res.json({ parametres: regles, difficultes: [] })

  const competences = (await lire(supabase.from('competences').select('*').eq('concours_code', code)))
  const scores = (await lire(supabase.from('scores_competences').select('*').in('etudiant_id', ids)))
    .filter(s => !s.provisoire && Number(s.score) < regles.seuil && competences.some(c => memeId(c.id, s.competence_id)))
  const historique = await lire(supabase.from('scores_historique').select('*').in('etudiant_id', ids))
  const envois = await lire(supabase.from('exercices').select('*').in('etudiant_id', ids))

  const difficultes = []
  for (const s of scores) {
    const eleve = eleves.find(e => memeId(e.id, s.etudiant_id))
    const competence = competences.find(c => memeId(c.id, s.competence_id))
    const envoisEleve = envois.filter(e => memeId(e.etudiant_id, s.etudiant_id))
    const recent = envoiRecent(envoisEleve, competence.id)
    const suggere = await exerciceNonRecu(eleve.id, competence.id, envoisEleve)
    difficultes.push({
      etudiant: { id: eleve.id, matricule: eleve.matricule, username: eleve.username, prenom: eleve.prenom, nom: eleve.nom },
      competence: { id: competence.id, code: competence.code, libelle: competence.libelle, matiere: competence.matiere },
      score: Number(s.score), nb_autoeval: s.nb_autoeval, nb_notes: s.nb_notes,
      historique: historique
        .filter(h => memeId(h.etudiant_id, s.etudiant_id) && memeId(h.competence_id, s.competence_id))
        .sort((a, b) => new Date(a.calcule_le) - new Date(b.calcule_le))
        .slice(-10)
        .map(h => ({ score: Number(h.score), provisoire: h.provisoire, date: h.calcule_le })),
      dernier_envoi: recent?.created_at ?? null,
      exercice_suggere: suggere ? { id: suggere.id, titre: suggere.titre, niveau: suggere.niveau } : null,
      peut_envoyer: !recent && !!suggere,
      raison: recent ? 'Déjà envoyé ces 7 derniers jours' : suggere ? null : 'Aucun exercice disponible pour cette compétence'
    })
  }
  difficultes.sort((a, b) => a.score - b.score)
  res.json({ parametres: regles, difficultes })
})

const envoiSchema = z.object({
  etudiant_id: z.union([z.string().trim().min(1).max(64), z.number().int()]),
  competence_id: uuid,
  exercice_id: uuid.nullish()
})

// POST /api/renforcement/envoyer — envoi en un clic (mode manuel, ou initiative du professeur)
router.post('/envoyer', verifyToken, requireRole('professeur', 'admin'), validate(envoiSchema), async (req, res) => {
  const [competence] = await lire(supabase.from('competences').select('*').eq('id', req.body.competence_id))
  if (!competence || !peutAcceder(req.user, competence.concours_code)) return message(res, 404, 'Compétence introuvable')

  const eleve = (await elevesDuConcours(competence.concours_code)).find(e => memeId(e.id, req.body.etudiant_id))
  if (!eleve) return message(res, 404, 'Élève introuvable pour ce concours')
  if (!peutGererEleve(req.user, eleve)) return message(res, 403, 'Cet élève ne fait pas partie de vos concours')

  const resultat = await envoyerRenforcement({
    etudiantId: eleve.id, competence, exerciceId: req.body.exercice_id ?? null, par: req.user.id, mode: 'manuel'
  })
  if (resultat.envoye) return res.status(201).json({ success: true })
  const messages = {
    deja_envoye: 'Un exercice a déjà été envoyé pour cette compétence ces 7 derniers jours',
    aucun_exercice: 'Aucun exercice disponible pour cette compétence',
    exercice_invalide: 'Exercice invalide pour cette compétence'
  }
  return message(res, resultat.raison === 'exercice_invalide' ? 400 : 409, messages[resultat.raison])
})

// POST /api/renforcement/recalculer — recalcule tous les scores d'un concours, sans aucun envoi (admin)
router.post('/recalculer', verifyToken, requireRole('admin'), validate(z.object({ concours: z.enum(CODES_CONCOURS) })), async (req, res) => {
  const nb = await recalculerConcours(req.body.concours, { declencher: false })
  res.json({ success: true, eleves: nb })
})

// ═══ ÉLÈVE : mes compétences et exercices recommandés ═══════════════════════

// GET /api/renforcement/mes-competences
router.get('/mes-competences', verifyToken, async (req, res) => {
  if (req.user.role !== 'etudiant') return message(res, 403, 'Réservé aux élèves')
  const codes = req.user.concours ?? []

  const toutesCompetences = await lire(supabase.from('competences').select('*'))
  const competences = toutesCompetences
    .filter(c => c.actif && codes.includes(c.concours_code))
    .sort((a, b) => a.matiere.localeCompare(b.matiere) || a.ordre - b.ordre)
  const scores = await lire(supabase.from('scores_competences').select('*').eq('etudiant_id', req.user.id))
  const envoyes = (await lire(supabase.from('exercices').select('*').eq('etudiant_id', req.user.id))).filter(e => e.renforcement_id)

  const parametres = {}
  for (const code of codes) parametres[code] = await reglesDuConcours(code)

  const liste = competences.map(c => {
    const s = scores.find(x => memeId(x.competence_id, c.id))
    const seuil = parametres[c.concours_code].seuil
    return {
      id: c.id, code: c.code, libelle: c.libelle, matiere: c.matiere, concours_code: c.concours_code, url: c.url ?? null,
      score: s ? Number(s.score) : null, provisoire: s ? s.provisoire : null, seuil,
      a_renforcer: s ? sousLeSeuil({ score: Number(s.score), provisoire: s.provisoire }, seuil) : false
    }
  })
  res.json({
    parametres,
    competences: liste,
    exercices: envoyes
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(e => ({
        id: e.id, titre: e.titre, statut: e.statut ?? null, envoye_le: e.created_at, mode: e.envoye_par_mode,
        // Concours de l'exercice : même si la compétence est désactivée (absente de `liste`)
        concours_code: toutesCompetences.find(c => memeId(c.id, e.competence_id))?.concours_code ?? null,
        competence: liste.find(c => memeId(c.id, e.competence_id)) ?? null
      }))
      // Un concours quitté ou une compétence supprimée : l'exercice n'est plus affiché
      .filter(e => e.concours_code !== null && codes.includes(e.concours_code))
  })
})

// GET /api/renforcement/envoyes/:id/fichier — l'élève télécharge un exercice qu'on lui a envoyé (lien signé 5 min)
router.get('/envoyes/:id/fichier', verifyToken, async (req, res) => {
  const [envoi] = await lire(supabase.from('exercices').select('*').eq('id', req.params.id))
  if (!envoi || !envoi.renforcement_id || !memeId(envoi.etudiant_id, req.user.id)) return message(res, 404, 'Exercice introuvable')
  const [exercice] = await lire(supabase.from('exercices_renforcement').select('*').eq('id', envoi.renforcement_id))
  if (!exercice) return message(res, 404, 'Fichier indisponible')
  res.json(await urlSignee(BUCKET, exercice.fichier_path))
})

export default router
