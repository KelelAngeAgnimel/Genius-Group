import express from 'express'
import multer from 'multer'
import { z } from 'zod'
import supabase from '../supabase.js'
import { verifyToken } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validate.js'
import { peutAcceder, peutPublierPour } from '../lib/concours.js'

const router = express.Router()

const court = (max) => z.string().trim().max(max)
// Les champs arrivent en multipart (chaînes)
const uploadSchema = z.object({
  titre: court(200).min(1),
  description: court(2000).nullish(),
  type: court(50).nullish(),
  matiere: court(100).min(1),
  concours: court(30).min(1),
  est_evaluation: z.union([z.boolean(), z.enum(['true', 'false'])]).nullish()
}).passthrough()
const visibiliteSchema = z.object({ visible: z.boolean() })

// Multer en mémoire — 50 Mo max, PDF uniquement
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true)
    else cb(new Error('Seuls les fichiers PDF sont acceptés'))
  }
})

// ══════════════════════════════════════════
// GET — Liste des ressources (sans URL)
// ══════════════════════════════════════════
router.get('/', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ressources')
      .select('id, titre, description, type, matiere, concours, visible, est_evaluation, created_at, professeur:professeur_id(username, prenom, nom)')
      .eq('visible', true)
      .order('created_at', { ascending: false })

    if (error) { console.error(error); return res.status(500).json({ message: 'Erreur serveur' }) }

    // Filtrer selon le concours — ne jamais exposer l'URL du fichier.
    // Les évaluations sont exclues de la Bibliothèque : elles vivent dans la page « Évaluation ».
    const filtrees = data.filter(r => !r.est_evaluation && peutAcceder(req.user, r.concours))
    res.json({ ressources: filtrees })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// ══════════════════════════════════════════
// GET — Toutes les ressources (prof/admin)
// ══════════════════════════════════════════
router.get('/toutes', verifyToken, async (req, res) => {
  try {
    if (!['professeur', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé' })
    }
    const { data, error } = await supabase
      .from('ressources')
      .select('id, titre, description, type, matiere, concours, visible, est_evaluation, professeur_id, created_at, professeur:professeur_id(username, prenom, nom)')
      .order('created_at', { ascending: false })

    if (error) { console.error(error); return res.status(500).json({ message: 'Erreur serveur' }) }
    // Les évaluations sont gérées à part (page « Évaluation »), on ne les mélange pas ici.
    res.json({ ressources: data.filter(r => !r.est_evaluation && peutAcceder(req.user, r.concours)) })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// ══════════════════════════════════════════
// GET — Évaluations visibles par l'élève (page Évaluation)
// Filtrées par le concours que l'élève prépare
// ══════════════════════════════════════════
router.get('/evaluations', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ressources')
      .select('id, titre, description, type, matiere, concours, visible, est_evaluation, created_at, professeur:professeur_id(username, prenom, nom)')
      .eq('visible', true)
      .eq('est_evaluation', true)
      .order('created_at', { ascending: false })

    if (error) { console.error(error); return res.status(500).json({ message: 'Erreur serveur' }) }

    const filtrees = data.filter(r => peutAcceder(req.user, r.concours))
    res.json({ ressources: filtrees })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// ══════════════════════════════════════════
// GET — Gestion des évaluations (prof/admin)
// Le prof ne voit QUE ses propres évaluations ; l'admin les voit toutes.
// ══════════════════════════════════════════
router.get('/evaluations/gestion', verifyToken, async (req, res) => {
  try {
    if (!['professeur', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé' })
    }
    let query = supabase
      .from('ressources')
      .select('id, titre, description, type, matiere, concours, visible, est_evaluation, professeur_id, created_at, professeur:professeur_id(username, prenom, nom)')
      .eq('est_evaluation', true)
      .order('created_at', { ascending: false })

    // Restriction : un professeur ne voit jamais l'ensemble des évaluations comme l'admin.
    if (req.user.role !== 'admin') {
      query = query.eq('professeur_id', req.user.id)
    }

    const { data, error } = await query
    if (error) { console.error(error); return res.status(500).json({ message: 'Erreur serveur' }) }
    res.json({ ressources: data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// ══════════════════════════════════════════
// GET — Ouvrir un document (proxy sécurisé)
// Génère une URL signée valable 1h uniquement
// si le token Genius est valide
// ══════════════════════════════════════════
router.get('/ouvrir/:id', verifyToken, async (req, res) => {
  try {
    const { data: ressource, error } = await supabase
      .from('ressources')
      .select('id, titre, type, concours, visible, storage_path')
      .eq('id', req.params.id)
      .single()

    if (error || !ressource) {
      return res.status(404).json({ message: 'Ressource introuvable' })
    }
    if (!ressource.visible) {
      return res.status(403).json({ message: 'Cette ressource n\'est pas disponible' })
    }
    if (!peutAcceder(req.user, ressource.concours)) {
      return res.status(403).json({ message: 'Accès refusé pour votre concours' })
    }
    if (!ressource.storage_path) {
      return res.status(404).json({ message: 'Fichier non trouvé' })
    }

    // Générer une URL signée valable 1 heure — jamais exposée dans le HTML
    const { data: signedData, error: signedError } = await supabase.storage
      .from('ressources')
      .createSignedUrl(ressource.storage_path, 3600)

    if (signedError) {
      return res.status(500).json({ message: 'Impossible de générer l\'accès au fichier' })
    }

    // Télécharger le fichier et le streamer directement à l'élève
    // L'URL signée n'est jamais transmise au navigateur
    const fileResponse = await fetch(signedData.signedUrl)
    if (!fileResponse.ok) {
      return res.status(500).json({ message: 'Erreur lors de la récupération du fichier' })
    }

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(ressource.titre)}.pdf"`)
    res.setHeader('Cache-Control', 'private, no-store')

    const reader = fileResponse.body.getReader()
    const pump = async () => {
      const { done, value } = await reader.read()
      if (done) { res.end(); return }
      res.write(Buffer.from(value))
      await pump()
    }
    await pump()

  } catch (err) {
    console.error('Erreur ouverture:', err)
    if (!res.headersSent) res.status(500).json({ message: 'Erreur serveur' })
  }
})

// ══════════════════════════════════════════
// POST — Upload d'un PDF par le prof
// Stocké dans Supabase Storage (bucket privé)
// ══════════════════════════════════════════
router.post('/upload', verifyToken, (req, res, next) => {
  upload.single('fichier')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'Fichier trop volumineux (50 Mo max)' })
      return res.status(400).json({ message: "Erreur lors de l'envoi du fichier" })
    }
    if (err) return res.status(400).json({ message: 'Fichier invalide, seuls les PDF sont acceptés' })
    next()
  })
}, validate(uploadSchema), async (req, res) => {
  try {
    const { role, id: professeur_id } = req.user
    if (!['professeur', 'admin'].includes(role)) {
      return res.status(403).json({ message: 'Accès refusé' })
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier reçu' })
    }

    const { titre, description, type, matiere, concours } = req.body
    if (!titre || !matiere || !concours) {
      return res.status(400).json({ message: 'titre, matière et concours sont requis' })
    }
    if (!peutPublierPour(req.user, concours)) {
      return res.status(403).json({ message: 'Vous ne pouvez publier que pour vos concours' })
    }

    // FormData transmet des chaînes : on convertit proprement en booléen
    const est_evaluation = req.body.est_evaluation === 'true' || req.body.est_evaluation === true

    // Chemin unique dans Supabase Storage
    const ext = req.file.originalname.split('.').pop()
    const storagePath = `${concours}/${Date.now()}-${titre.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`

    // Upload dans le bucket "ressources" de Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('ressources')
      .upload(storagePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      })

    if (uploadError) {
      return res.status(500).json({ message: "Erreur lors de l'enregistrement du fichier" })
    }

    // Sauvegarder dans la table ressources — uniquement le chemin, jamais l'URL
    const { data, error } = await supabase
      .from('ressources')
      .insert([{
        titre,
        description: description || null,
        type: type || 'pdf',
        matiere,
        concours,
        storage_path: storagePath,
        url: null,
        drive_file_id: null,
        professeur_id,
        visible: true,
        est_evaluation
      }])
      .select('id, titre, type, matiere, concours, visible, est_evaluation, created_at')
      .single()

    if (error) {
      // Supprimer le fichier uploadé si la DB échoue
      await supabase.storage.from('ressources').remove([storagePath])
      { console.error(error); return res.status(500).json({ message: 'Erreur serveur' }) }
    }

    res.json({ success: true, ressource: data })
  } catch (err) {
    console.error('Erreur upload:', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// ══════════════════════════════════════════
// PATCH — Changer la visibilité
// ══════════════════════════════════════════
router.patch('/:id/visibilite', verifyToken, validate(visibiliteSchema), async (req, res) => {
  try {
    if (!['professeur', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    // Un professeur ne peut agir que sur ses propres évaluations
    const { data: existante } = await supabase
      .from('ressources')
      .select('professeur_id, est_evaluation')
      .eq('id', req.params.id)
      .single()
    if (!existante) return res.status(404).json({ message: 'Ressource introuvable' })
    if (req.user.role !== 'admin' && existante.professeur_id !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez modifier que vos propres ressources' })
    }

    const { visible } = req.body
    const { data, error } = await supabase
      .from('ressources')
      .update({ visible })
      .eq('id', req.params.id)
      .select('id, titre, visible, est_evaluation')
      .single()

    if (error) { console.error(error); return res.status(500).json({ message: 'Erreur serveur' }) }
    res.json({ success: true, ressource: data })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// ══════════════════════════════════════════
// DELETE — Supprimer (DB + Storage)
// ══════════════════════════════════════════
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (!['professeur', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    const { data: ressource } = await supabase
      .from('ressources')
      .select('storage_path, professeur_id, est_evaluation')
      .eq('id', req.params.id)
      .single()

    // Un professeur ne peut supprimer que ses propres évaluations
    if (!ressource) return res.status(404).json({ message: 'Ressource introuvable' })
    if (req.user.role !== 'admin' && ressource.professeur_id !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez supprimer que vos propres ressources' })
    }

    // Supprimer le fichier de Supabase Storage
    if (ressource?.storage_path) {
      await supabase.storage.from('ressources').remove([ressource.storage_path])
    }

    const { error } = await supabase.from('ressources').delete().eq('id', req.params.id)
    if (error) { console.error(error); return res.status(500).json({ message: 'Erreur serveur' }) }
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

export default router