import express from 'express'
import multer from 'multer'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from './auth.js'
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// Multer en mémoire — 50 Mo max, PDF uniquement
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true)
    else cb(new Error('Seuls les fichiers PDF sont acceptés'))
  }
})

// Rôles par concours (un étudiant "all"/"both" fait plusieurs concours)
const ROLES_INPHB  = ['etudiant_inphb', 'etudiant_both', 'etudiant_inphb_cme', 'etudiant_all']
const ROLES_ESATIC = ['etudiant_esatic', 'etudiant_both', 'etudiant_esatic_cme', 'etudiant_all']
const ROLES_CME    = ['etudiant_cme', 'etudiant_inphb_cme', 'etudiant_esatic_cme', 'etudiant_all']

function peutAcceder(role, concours) {
  if (role === 'admin' || role === 'professeur') return true

  // Normalisation : insensible à la casse, tolère 'INP-HB', 'inphb', 'inp-hb + esatic', 'all', 'tous'...
  const c = (concours || '').toString().trim().toLowerCase()
  if (c === 'tous' || c === 'all') return true

  // Une ressource peut cibler plusieurs concours à la fois (valeur combinée)
  const cibleINPHB  = c.includes('inp')
  const cibleESATIC = c.includes('esatic')
  const cibleCME    = c.includes('cme')

  if (cibleINPHB  && ROLES_INPHB.includes(role))  return true
  if (cibleESATIC && ROLES_ESATIC.includes(role)) return true
  if (cibleCME    && ROLES_CME.includes(role))    return true
  return false
}

// ══════════════════════════════════════════
// GET — Liste des ressources (sans URL)
// ══════════════════════════════════════════
router.get('/', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ressources')
      .select('id, titre, description, type, matiere, concours, visible, created_at, professeur:professeur_id(username, prenom, nom)')
      .eq('visible', true)
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ message: error.message })

    // Filtrer selon le concours — ne jamais exposer l'URL du fichier
    const filtrees = data.filter(r => peutAcceder(req.user.role, r.concours))
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
      .select('id, titre, description, type, matiere, concours, visible, created_at, professeur:professeur_id(username, prenom, nom)')
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ message: error.message })
    res.json({ ressources: data })
  } catch (err) {
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
    if (!peutAcceder(req.user.role, ressource.concours)) {
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
      return res.status(400).json({ message: err.message })
    }
    if (err) return res.status(400).json({ message: err.message })
    next()
  })
}, async (req, res) => {
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
      return res.status(500).json({ message: `Erreur upload : ${uploadError.message}` })
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
        visible: true
      }])
      .select('id, titre, type, matiere, concours, visible, created_at')
      .single()

    if (error) {
      // Supprimer le fichier uploadé si la DB échoue
      await supabase.storage.from('ressources').remove([storagePath])
      return res.status(500).json({ message: error.message })
    }

    res.json({ success: true, ressource: data })
  } catch (err) {
    console.error('Erreur upload:', err)
    res.status(500).json({ message: `Erreur : ${err.message}` })
  }
})

// ══════════════════════════════════════════
// PATCH — Changer la visibilité
// ══════════════════════════════════════════
router.patch('/:id/visibilite', verifyToken, async (req, res) => {
  try {
    if (!['professeur', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé' })
    }
    const { visible } = req.body
    const { data, error } = await supabase
      .from('ressources')
      .update({ visible })
      .eq('id', req.params.id)
      .select('id, titre, visible')
      .single()

    if (error) return res.status(500).json({ message: error.message })
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
      .select('storage_path')
      .eq('id', req.params.id)
      .single()

    // Supprimer le fichier de Supabase Storage
    if (ressource?.storage_path) {
      await supabase.storage.from('ressources').remove([ressource.storage_path])
    }

    const { error } = await supabase.from('ressources').delete().eq('id', req.params.id)
    if (error) return res.status(500).json({ message: error.message })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

export default router