import express from 'express'
import multer from 'multer'
import { z } from 'zod'
import supabase from '../supabase.js'
import { verifyToken, requireRole, estEtudiant } from '../middleware/authMiddleware.js'
import { depotLimiter } from '../middleware/rateLimit.js'
import { validate } from '../middleware/validate.js'
import { peutAcceder, peutPublierPour, codesDepuisContenu, genAutoPermise, CODES_CONCOURS, LIBELLES } from '../lib/concours.js'
import { optionsConcours } from '../lib/inscriptions.js'
import { assurerRattachement, recalculerSansBloquer } from '../lib/renforcement.js'
import {
  LIMITES, detecterType, fusionnerEnPdf, urlSignee, supprimerFichiers, deposerPdf, nomAffichable, FichierInvalide
} from '../lib/fichiers.js'

const router = express.Router()

// ── Utilitaires ─────────────────────────────────────────────────────────────

const message = (res, statut, texte) => res.status(statut).json({ message: texte, error: texte })
const estPersonnel = (user) => user.role === 'professeur' || user.role === 'admin'
const idValide = z.string().uuid()

// Les identifiants sont des uuid : tout autre format est rejeté avant d'atteindre la base
const controleId = (...noms) => (req, res, next) => {
  for (const nom of noms) {
    if (!idValide.safeParse(req.params[nom]).success) return message(res, 400, 'Identifiant invalide')
  }
  next()
}

// Réception de fichiers en mémoire. Le vrai type est vérifié ensuite sur le contenu (magic bytes).
const televerser = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: LIMITES.octetsParFichier, files: LIMITES.nbFichiers }
})
const recevoir = (champs) => (req, res, next) => {
  televerser.fields(champs)(req, res, (err) => {
    if (!err) return next()
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return message(res, 400, 'Un fichier dépasse 15 Mo')
      if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') return message(res, 400, 'Trop de fichiers (10 maximum)')
      return message(res, 400, 'Envoi de fichier invalide')
    }
    next(err)
  })
}

// Contrôle d'un fichier reçu : type réel PDF / JPEG / PNG
function typeReel(fichier) {
  const type = detecterType(fichier.buffer)
  if (!type) throw new FichierInvalide(`« ${nomAffichable(fichier.originalname)} » n’est pas un PDF, JPG ou PNG valide`)
  return type
}

async function chargerEvaluation(id) {
  const { data, error } = await supabase.from('evaluations').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

// Ce qu'on renvoie au client : jamais de chemin de stockage
const evaluationPublique = (e) => {
  // eslint-disable-next-line no-unused-vars
  const { sujet_storage_path, ...reste } = e
  return { ...reste, a_sujet: !!sujet_storage_path, ouverte: new Date(e.date_ouverture) <= new Date() }
}
const copiePublique = (c, { avecCorrection = true } = {}) => {
  if (!c) return null
  const corrigee = c.statut === 'corrigee'
  return {
    id: c.id,
    evaluation_id: c.evaluation_id,
    etudiant_id: c.etudiant_id,
    deposee_le: c.deposee_le,
    en_retard: c.en_retard,
    statut: c.statut,
    nb_fichiers: Array.isArray(c.fichiers) ? c.fichiers.length : 0,
    note: corrigee && avecCorrection ? c.note : null,
    commentaire: corrigee && avecCorrection ? c.commentaire : null,
    a_corrige: corrigee && !!c.corrige_storage_path,
    corrige_le: corrigee ? c.corrige_le : null
  }
}

// Convertit un fichier unique (PDF/JPG/PNG) en PDF pour un affichage uniforme
async function enPdf(fichier) {
  return fusionnerEnPdf([{ buffer: fichier.buffer, type: typeReel(fichier) }])
}

// ── Schémas ─────────────────────────────────────────────────────────────────

const MATIERES_ENSEA = ['Français', 'Mathématiques'] // docs/pole-educatif.md
const CODE_COMPETENCE = /^[A-Z]{2}-[A-Z]{3}-\d{1,2}$/    // ex. FR-RES-1, MA-ANA-3

const competencesSchema = z.preprocess((v) => {
  if (v === undefined || v === null || v === '') return []
  if (Array.isArray(v)) return v
  if (typeof v === 'string') {
    try { const j = JSON.parse(v); if (Array.isArray(j)) return j } catch { /* liste séparée par des virgules */ }
    return v.split(',').map(s => s.trim()).filter(Boolean)
  }
  return v
}, z.array(z.string().trim().toUpperCase().regex(CODE_COMPETENCE, 'Code de compétence invalide')).max(30))

const booleen = z.preprocess(v => (v === 'true' ? true : v === 'false' ? false : v), z.boolean())

const creerSchema = z.object({
  concours_code: z.enum(CODES_CONCOURS).default('ensea'),
  matiere: z.string().trim().min(1).max(100),
  titre: z.string().trim().min(1).max(200),
  consignes: z.string().trim().max(5000).nullish(),
  date_ouverture: z.string().datetime({ offset: true }).optional(),
  date_limite: z.string().datetime({ offset: true }),
  retard_autorise: booleen.optional().default(true),
  competences: competencesSchema.optional().default([])
}).refine(v => v.concours_code !== 'ensea' || MATIERES_ENSEA.includes(v.matiere), {
  path: ['matiere'], message: 'Matière ENSEA : Français ou Mathématiques'
}).refine(v => new Date(v.date_limite) > new Date(v.date_ouverture ?? Date.now()), {
  path: ['date_limite'], message: 'La date limite doit être après l’ouverture'
})

const correctionSchema = z.object({
  note: z.preprocess(v => (typeof v === 'string' ? Number(v.replace(',', '.')) : v), z.number().finite().min(0).max(20)),
  commentaire: z.string().trim().max(5000).nullish()
})

// ═══════════════════════════════════════════════════════════════════════════
// PROFESSEUR / ADMIN
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/evaluations — créer une évaluation (+ sujet PDF facultatif)
router.post('/', verifyToken, requireRole('professeur', 'admin'), recevoir([{ name: 'sujet', maxCount: 1 }]), validate(creerSchema), async (req, res) => {
  const v = req.body
  if (!peutPublierPour(req.user, v.concours_code)) {
    return message(res, 403, 'Vous ne pouvez créer des évaluations que pour vos concours')
  }

  const { data: doublon, error: errDoublon } = await supabase
    .from('evaluations').select('id').eq('concours_code', v.concours_code).eq('titre', v.titre).maybeSingle()
  if (errDoublon) throw errDoublon
  if (doublon) return message(res, 409, 'Une évaluation porte déjà ce titre pour ce concours')

  let sujetPath = null
  const sujet = req.files?.sujet?.[0]
  if (sujet) {
    let pdf
    try { pdf = await enPdf(sujet) } catch (err) {
      if (err instanceof FichierInvalide) return message(res, 400, err.message)
      throw err
    }
    sujetPath = `${v.concours_code}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`
    await deposerPdf('sujets', sujetPath, pdf)
  }

  const { data, error } = await supabase.from('evaluations').insert([{
    concours_code: v.concours_code,
    matiere: v.matiere,
    titre: v.titre,
    consignes: v.consignes || null,
    sujet_storage_path: sujetPath,
    date_ouverture: v.date_ouverture ?? new Date().toISOString(),
    date_limite: v.date_limite,
    retard_autorise: v.retard_autorise,
    competences: v.competences,
    created_by: req.user.id
  }]).select().single()

  if (error) {
    await supprimerFichiers('sujets', [sujetPath])
    throw error
  }
  res.status(201).json({ evaluation: evaluationPublique(data) })
})

// GET /api/evaluations/gestion — évaluations visibles par le personnel, avec compteurs de copies
router.get('/gestion', verifyToken, requireRole('professeur', 'admin'), async (req, res) => {
  const { data: evaluations, error } = await supabase
    .from('evaluations').select('*').order('date_limite', { ascending: false })
  if (error) throw error
  const visibles = (evaluations || []).filter(e => peutAcceder(req.user, e.concours_code))

  const { data: copies, error: errCopies } = await supabase
    .from('copies').select('id, evaluation_id, statut, en_retard')
  if (errCopies) throw errCopies

  res.json({
    evaluations: visibles.map(e => {
      const siennes = (copies || []).filter(c => c.evaluation_id === e.id)
      return {
        ...evaluationPublique(e),
        nb_copies: siennes.length,
        nb_a_corriger: siennes.filter(c => c.statut !== 'corrigee').length,
        nb_en_retard: siennes.filter(c => c.en_retard).length
      }
    })
  })
})

// GET /api/evaluations/:id/copies?filtre=non_corrigees|en_retard — copies d'une évaluation
router.get('/:id/copies', verifyToken, requireRole('professeur', 'admin'), controleId('id'), async (req, res) => {
  const evaluation = await chargerEvaluation(req.params.id)
  if (!evaluation) return message(res, 404, 'Évaluation introuvable')
  if (!peutAcceder(req.user, evaluation.concours_code)) return message(res, 403, 'Accès refusé')

  const { data, error } = await supabase
    .from('copies')
    .select('*, etudiant:etudiant_id(id, matricule, username, prenom, nom)')
    .eq('evaluation_id', evaluation.id)
    .order('deposee_le', { ascending: true })
  if (error) throw error

  let copies = data || []
  if (req.query.filtre === 'non_corrigees') copies = copies.filter(c => c.statut !== 'corrigee')
  if (req.query.filtre === 'en_retard') copies = copies.filter(c => c.en_retard)

  res.json({
    evaluation: evaluationPublique(evaluation),
    copies: copies.map(c => ({ ...copiePublique(c), commentaire: c.commentaire, note: c.note, etudiant: c.etudiant }))
  })
})

// PUT /api/evaluations/copies/:copieId/correction — note /20, commentaire, corrigé annoté facultatif
router.put('/copies/:copieId/correction', verifyToken, requireRole('professeur', 'admin'), controleId('copieId'),
  recevoir([{ name: 'corrige', maxCount: 1 }]), validate(correctionSchema), async (req, res) => {
    const { data: copie, error: errCopie } = await supabase.from('copies').select('*').eq('id', req.params.copieId).maybeSingle()
    if (errCopie) throw errCopie
    if (!copie) return message(res, 404, 'Copie introuvable')
    const evaluation = await chargerEvaluation(copie.evaluation_id)
    if (!evaluation) return message(res, 404, 'Évaluation introuvable')
    if (!peutAcceder(req.user, evaluation.concours_code)) return message(res, 403, 'Accès refusé')

    // Corrigé annoté (PDF, JPG ou PNG → stocké en PDF)
    let nouveauCorrige = null
    const fichier = req.files?.corrige?.[0]
    if (fichier) {
      try { nouveauCorrige = await enPdf(fichier) } catch (err) {
        if (err instanceof FichierInvalide) return message(res, 400, err.message)
        throw err
      }
    }
    const cheminCorrige = nouveauCorrige
      ? `${copie.evaluation_id}/${copie.etudiant_id}/corrige-${Date.now()}.pdf`
      : copie.corrige_storage_path
    if (nouveauCorrige) await deposerPdf('copies', cheminCorrige, nouveauCorrige)

    const { data, error } = await supabase.from('copies').update({
      statut: 'corrigee',
      note: req.body.note,
      commentaire: req.body.commentaire || null,
      corrige_storage_path: cheminCorrige,
      corrige_par: req.user.id,
      corrige_le: new Date().toISOString()
    }).eq('id', copie.id).select().single()
    if (error) {
      if (nouveauCorrige) await supprimerFichiers('copies', [cheminCorrige])
      throw error
    }
    if (nouveauCorrige && copie.corrige_storage_path) await supprimerFichiers('copies', [copie.corrige_storage_path])

    // La note alimente automatiquement « Mes notes » (une note par élève / évaluation)
    const periode = `Évaluation — ${evaluation.titre}`.slice(0, 50)
    const concoursNote = LIBELLES[evaluation.concours_code] ?? evaluation.concours_code
    const { data: existante, error: errNote } = await supabase.from('notes').select('id')
      .eq('etudiant_id', copie.etudiant_id).eq('matiere', evaluation.matiere)
      .eq('concours', concoursNote).eq('periode', periode).maybeSingle()
    if (errNote) throw errNote
    const ligne = { note: req.body.note, professeur_id: req.user.id }
    const resultat = existante
      ? await supabase.from('notes').update(ligne).eq('id', existante.id)
      : await supabase.from('notes').insert([{ ...ligne, etudiant_id: copie.etudiant_id, matiere: evaluation.matiere, concours: concoursNote, periode }])
    if (resultat.error) throw resultat.error

    // Les compétences de l'évaluation sont connues : la note compte pour elles, et le score est recalculé
    if (evaluation.competences?.length) {
      const { data: competences, error: errComp } = await supabase.from('competences').select('id, code')
        .eq('concours_code', evaluation.concours_code)
      if (errComp) throw errComp
      await assurerRattachement({
        concours: evaluation.concours_code, matiere: evaluation.matiere, periode,
        competenceIds: (competences ?? []).filter(c => evaluation.competences.includes(c.code)).map(c => c.id)
      })
    }
    await recalculerSansBloquer(copie.etudiant_id)

    res.json({ success: true, copie: copiePublique(data) })
  })

// ═══════════════════════════════════════════════════════════════════════════
// ÉLÈVE
// ═══════════════════════════════════════════════════════════════════════════

// Une évaluation « à rendre » a sa date limite dans les JOURS_A_RENDRE prochains jours
const JOURS_A_RENDRE = 3

// GET /api/evaluations/resume — une entrée par concours que l'utilisateur peut voir (cartes de /outils/evaluations)
//  - concours sans génération automatique (ENSEA) : table evaluations + copies de l'élève
//  - autres concours : évaluations publiées en PDF (ressources), sans notion d'échéance
router.get('/resume', verifyToken, async (req, res) => {
  const codes = CODES_CONCOURS.filter(code => peutAcceder(req.user, code))
  const options = await optionsConcours()
  const codesCopies = codes.filter(code => !genAutoPermise(options, code))
  const codesPdf = codes.filter(code => genAutoPermise(options, code))
  const eleve = estEtudiant(req.user.role)
  const maintenant = Date.now()
  const limite = maintenant + JOURS_A_RENDRE * 86400_000
  const resume = Object.fromEntries(codes.map(code => [code, { code, total: 0, a_faire: 0, a_rendre: 0 }]))

  if (codesCopies.length > 0) {
    const { data: evaluations, error } = await supabase.from('evaluations').select('*').in('concours_code', codesCopies)
    if (error) throw error
    let copies = new Set() // evaluation_id déjà déposés par l'élève
    if (eleve) {
      const { data, error: errCopies } = await supabase.from('copies').select('evaluation_id').eq('etudiant_id', req.user.id)
      if (errCopies) throw errCopies
      copies = new Set((data || []).map(c => String(c.evaluation_id)))
    }
    for (const e of evaluations || []) {
      const r = resume[e.concours_code]
      if (!r || !peutAcceder(req.user, e.concours_code)) continue
      r.total += 1
      const ouverte = new Date(e.date_ouverture) <= new Date(maintenant)
      const faite = copies.has(String(e.id))
      if (eleve && ouverte && !faite) {
        r.a_faire += 1
        const fin = new Date(e.date_limite).getTime()
        if (fin > maintenant && fin <= limite) r.a_rendre += 1
      }
    }
  }

  if (codesPdf.length > 0) {
    const { data, error } = await supabase
      .from('ressources').select('concours').eq('visible', true).eq('est_evaluation', true)
    if (error) throw error
    for (const ressource of data || []) {
      const cibles = codesDepuisContenu(ressource.concours)
      for (const code of codesPdf) {
        if (cibles === null || cibles.includes(code)) {
          // Pas de suivi « fait / à faire » pour ces PDF : seul le total est renvoyé (a_faire reste à 0)
          resume[code].total += 1
        }
      }
    }
  }

  res.json({ concours: codes.map(code => ({ ...resume[code], generation_auto_tests: genAutoPermise(options, code) })) })
})

// GET /api/evaluations/mes — « Mes évaluations » : à faire / déposées / corrigées
router.get('/mes', verifyToken, async (req, res) => {
  if (!estEtudiant(req.user.role)) return message(res, 403, 'Réservé aux élèves')

  const { data: evaluations, error } = await supabase
    .from('evaluations').select('*').order('date_limite', { ascending: true })
  if (error) throw error
  const { data: copies, error: errCopies } = await supabase
    .from('copies').select('*').eq('etudiant_id', req.user.id)
  if (errCopies) throw errCopies

  const liste = (evaluations || [])
    .filter(e => peutAcceder(req.user, e.concours_code))
    .map(e => {
      const publique = evaluationPublique(e)
      const copie = copiePublique((copies || []).find(c => c.evaluation_id === e.id))
      return {
        ...publique,
        consignes: publique.ouverte ? e.consignes : null, // rien avant l'ouverture
        copie,
        etat: !copie ? 'a_faire' : copie.statut === 'corrigee' ? 'corrigee' : 'deposee'
      }
    })
  res.json({ evaluations: liste })
})

// POST /api/evaluations/:id/copie — dépôt ou redépôt (tant que la copie n'est pas corrigée)
router.post('/:id/copie', verifyToken, controleId('id'), depotLimiter, recevoir([{ name: 'fichiers', maxCount: LIMITES.nbFichiers }]), async (req, res) => {
  if (!estEtudiant(req.user.role)) return message(res, 403, 'Réservé aux élèves')

  const evaluation = await chargerEvaluation(req.params.id)
  if (!evaluation || !peutAcceder(req.user, evaluation.concours_code)) return message(res, 404, 'Évaluation introuvable')

  const maintenant = new Date()
  if (new Date(evaluation.date_ouverture) > maintenant) return message(res, 403, 'Cette évaluation n’est pas encore ouverte')
  // Le retard est toujours calculé par le serveur (jamais fourni par le client)
  const enRetard = maintenant > new Date(evaluation.date_limite)
  if (enRetard && !evaluation.retard_autorise) return message(res, 409, 'La date limite est dépassée : le dépôt n’est plus possible')

  const recus = req.files?.fichiers ?? []
  if (recus.length === 0) return message(res, 400, 'Ajoutez au moins un fichier')
  const total = recus.reduce((s, f) => s + f.size, 0)
  if (total > LIMITES.octetsTotal) return message(res, 400, 'Les fichiers dépassent 20 Mo au total')

  const { data: existante, error: errEx } = await supabase
    .from('copies').select('*').eq('evaluation_id', evaluation.id).eq('etudiant_id', req.user.id).maybeSingle()
  if (errEx) throw errEx
  if (existante?.statut === 'corrigee') return message(res, 409, 'Cette copie est déjà corrigée : elle ne peut plus être modifiée')

  let pdf
  try {
    pdf = await fusionnerEnPdf(recus.map(f => ({ buffer: f.buffer, type: typeReel(f) })))
  } catch (err) {
    if (err instanceof FichierInvalide) return message(res, 400, err.message)
    throw err
  }

  const chemin = `${evaluation.id}/${req.user.id}/${Date.now()}.pdf`
  await deposerPdf('copies', chemin, pdf)

  const ligne = {
    fichiers: [{ path: chemin, nom: 'copie.pdf', taille: pdf.length, type: 'application/pdf', sources: recus.map(f => nomAffichable(f.originalname)) }],
    deposee_le: maintenant.toISOString(),
    en_retard: enRetard,
    statut: 'deposee'
  }
  const { data, error } = existante
    ? await supabase.from('copies').update(ligne).eq('id', existante.id).select().single()
    : await supabase.from('copies').insert([{ ...ligne, evaluation_id: evaluation.id, etudiant_id: req.user.id }]).select().single()

  if (error) {
    await supprimerFichiers('copies', [chemin])
    // 23505 : deux dépôts simultanés pour la même évaluation
    if (error.code === '23505') return message(res, 409, 'Un dépôt est déjà en cours, réessayez')
    throw error
  }
  if (existante) await supprimerFichiers('copies', (existante.fichiers ?? []).map(f => f.path))

  res.status(existante ? 200 : 201).json({ success: true, copie: copiePublique(data) })
})

// ═══════════════════════════════════════════════════════════════════════════
// URL SIGNÉES (5 min) — jamais de chemin ni d'URL permanente dans les listes
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/evaluations/:id/sujet — élèves du concours (après ouverture) et personnel
router.get('/:id/sujet', verifyToken, controleId('id'), async (req, res) => {
  const evaluation = await chargerEvaluation(req.params.id)
  if (!evaluation || !peutAcceder(req.user, evaluation.concours_code)) return message(res, 404, 'Évaluation introuvable')
  if (!estPersonnel(req.user) && new Date(evaluation.date_ouverture) > new Date()) {
    return message(res, 403, 'Cette évaluation n’est pas encore ouverte')
  }
  if (!evaluation.sujet_storage_path) return message(res, 404, 'Aucun sujet déposé pour cette évaluation')
  res.json(await urlSignee('sujets', evaluation.sujet_storage_path))
})

// Copie accessible à son auteur, ou au personnel autorisé pour le concours de l'évaluation
async function copieAccessible(req, res) {
  const { data: copie, error } = await supabase.from('copies').select('*').eq('id', req.params.copieId).maybeSingle()
  if (error) throw error
  if (!copie) { message(res, 404, 'Copie introuvable'); return null }

  if (String(copie.etudiant_id) === String(req.user.id)) return copie
  if (estPersonnel(req.user)) {
    const evaluation = await chargerEvaluation(copie.evaluation_id)
    if (evaluation && peutAcceder(req.user, evaluation.concours_code)) return copie
  }
  message(res, 403, 'Accès refusé')
  return null
}

// GET /api/evaluations/copies/:copieId/fichier — la copie (PDF)
router.get('/copies/:copieId/fichier', verifyToken, controleId('copieId'), async (req, res) => {
  const copie = await copieAccessible(req, res)
  if (!copie) return
  const chemin = copie.fichiers?.[0]?.path
  if (!chemin) return message(res, 404, 'Aucun fichier')

  // Le professeur qui ouvre une copie la passe « en correction »
  if (estPersonnel(req.user) && copie.statut === 'deposee') {
    await supabase.from('copies').update({ statut: 'en_correction' }).eq('id', copie.id)
  }
  res.json(await urlSignee('copies', chemin))
})

// GET /api/evaluations/copies/:copieId/corrige — corrigé annoté (élève : seulement une fois corrigée)
router.get('/copies/:copieId/corrige', verifyToken, controleId('copieId'), async (req, res) => {
  const copie = await copieAccessible(req, res)
  if (!copie) return
  if (!estPersonnel(req.user) && copie.statut !== 'corrigee') return message(res, 403, 'La copie n’est pas encore corrigée')
  if (!copie.corrige_storage_path) return message(res, 404, 'Aucun corrigé annoté')
  res.json(await urlSignee('copies', copie.corrige_storage_path))
})

export default router
