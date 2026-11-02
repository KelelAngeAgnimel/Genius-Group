import express from 'express'
import { z } from 'zod'
import supabase from '../supabase.js'
import { verifyToken, requireRole } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validate.js'
import { peutAcceder, CODES_CONCOURS } from '../lib/concours.js'

const router = express.Router()

const message = (res, statut, texte) => res.status(statut).json({ message: texte, error: texte })
const CODE_COMPETENCE = /^[A-Z]{2}-[A-Z]{3}-\d{1,2}$/ // ex. FR-RES-1, MA-ANA-3 (même format que les évaluations)

const urlSchema = z.preprocess(v => (v === '' ? null : v),
  z.string().trim().max(500).refine(v => { try { return new URL(v).protocol === 'https:' } catch { return false } }, 'Lien https invalide').nullish())

const ligneSchema = z.object({
  matiere: z.string().trim().min(1).max(100),
  code: z.string().trim().toUpperCase().regex(CODE_COMPETENCE, 'Code invalide (ex. FR-RES-1)'),
  libelle: z.string().trim().min(1).max(500),
  ordre: z.coerce.number().int().min(0).max(9999).default(0),
  url: urlSchema
})
const creerSchema = ligneSchema.extend({ concours_code: z.enum(CODES_CONCOURS) })
const modifierSchema = ligneSchema.omit({ code: true }).partial().extend({ actif: z.boolean().optional() })
const importSchema = z.object({
  concours_code: z.enum(CODES_CONCOURS),
  lignes: z.array(z.unknown()).min(1).max(500),
  confirmer: z.boolean().optional().default(false)
})

const lire = async (requete) => {
  const { data, error } = await requete
  if (error) throw error
  return data ?? []
}

// GET /api/competences?concours=ensea[&inactives=1] — référentiel (élèves : leurs concours, compétences actives)
router.get('/', verifyToken, async (req, res) => {
  const toutes = await lire(supabase.from('competences').select('*').order('ordre'))
  const voirInactives = req.user.role === 'admin' && req.query.inactives === '1'
  const liste = toutes
    .filter(c => (voirInactives || c.actif) && peutAcceder(req.user, c.concours_code))
    .filter(c => !req.query.concours || c.concours_code === req.query.concours)
    .filter(c => !req.query.matiere || c.matiere === req.query.matiere)
    .sort((a, b) => a.concours_code.localeCompare(b.concours_code) || a.matiere.localeCompare(b.matiere) || a.ordre - b.ordre)
  res.json({ competences: liste })
})

// POST /api/competences — ajouter une compétence (admin)
router.post('/', verifyToken, requireRole('admin'), validate(creerSchema), async (req, res) => {
  const v = req.body
  const existante = await lire(supabase.from('competences').select('id').eq('concours_code', v.concours_code).eq('code', v.code))
  if (existante.length > 0) return message(res, 409, 'Ce code existe déjà pour ce concours')
  const { data, error } = await supabase.from('competences').insert([{
    concours_code: v.concours_code, matiere: v.matiere, code: v.code, libelle: v.libelle, ordre: v.ordre, url: v.url || null, actif: true
  }]).select().single()
  if (error) throw error
  res.status(201).json({ competence: data })
})

// PATCH /api/competences/:id — modifier libellé, ordre, lien, matière, activation (admin)
router.patch('/:id', verifyToken, requireRole('admin'), validate(modifierSchema), async (req, res) => {
  const updates = {}
  for (const k of ['matiere', 'libelle', 'ordre', 'url', 'actif']) {
    if (req.body[k] !== undefined) updates[k] = k === 'url' ? (req.body.url || null) : req.body[k]
  }
  if (Object.keys(updates).length === 0) return message(res, 400, 'Aucune modification fournie')
  const { data, error } = await supabase.from('competences').update(updates).eq('id', req.params.id).select().maybeSingle()
  if (error) throw error
  if (!data) return message(res, 404, 'Compétence introuvable')
  res.json({ competence: data })
})

// DELETE /api/competences/:id — supprime si jamais utilisée, sinon désactive (l'historique est conservé)
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  const utilisee =
    (await lire(supabase.from('seance_competences').select('seance_id').eq('competence_id', req.params.id))).length > 0 ||
    (await lire(supabase.from('auto_evaluations').select('id').eq('competence_id', req.params.id))).length > 0
  if (utilisee) {
    const { error } = await supabase.from('competences').update({ actif: false }).eq('id', req.params.id)
    if (error) throw error
    return res.json({ success: true, desactivee: true })
  }
  const { error } = await supabase.from('competences').delete().eq('id', req.params.id)
  if (error) throw error
  res.json({ success: true, desactivee: false })
})

// POST /api/competences/import — import CSV déjà lu par le navigateur (admin)
// 1er appel (confirmer: false) : aperçu sans rien écrire. 2e appel (confirmer: true) : application,
// seulement si aucune ligne n'est en erreur. Une ligne dont le code existe déjà met à jour la compétence.
router.post('/import', verifyToken, requireRole('admin'), validate(importSchema), async (req, res) => {
  const { concours_code, lignes, confirmer } = req.body
  const existantes = await lire(supabase.from('competences').select('id, code').eq('concours_code', concours_code))
  const parCode = new Map(existantes.map(c => [c.code, c.id]))

  const valides = []
  const erreurs = []
  const vus = new Set()
  lignes.forEach((brute, i) => {
    const resultat = ligneSchema.safeParse(brute)
    if (!resultat.success) {
      const champs = [...new Set(resultat.error.issues.map(p => p.path.join('.') || 'ligne'))].join(', ')
      return erreurs.push({ ligne: i + 1, message: `Valeurs invalides : ${champs}` })
    }
    if (vus.has(resultat.data.code)) return erreurs.push({ ligne: i + 1, message: `Code en double dans le fichier : ${resultat.data.code}` })
    vus.add(resultat.data.code)
    valides.push({ ...resultat.data, url: resultat.data.url || null, existe: parCode.has(resultat.data.code) })
  })

  const ajouts = valides.filter(l => !l.existe).length
  const misesAJour = valides.length - ajouts
  const peutAppliquer = confirmer && erreurs.length === 0

  if (peutAppliquer) {
    for (const l of valides) {
      const { existe, ...champs } = l // eslint-disable-line no-unused-vars
      const { error } = existe
        ? await supabase.from('competences').update({ ...champs, actif: true }).eq('id', parCode.get(l.code))
        : await supabase.from('competences').insert([{ ...champs, concours_code, actif: true }])
      if (error) throw error
    }
  }
  res.json({ appliquee: peutAppliquer, ajouts, mises_a_jour: misesAJour, erreurs, apercu: valides.slice(0, 20) })
})

export default router
