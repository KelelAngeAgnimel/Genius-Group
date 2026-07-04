import express from 'express'
import multer from 'multer'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from './auth.js'
import { google } from 'googleapis'
import { Readable } from 'stream'
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// ══════════════════════════════════════════
// CLIENT GOOGLE DRIVE
// ══════════════════════════════════════════
function getDriveClient() {
  let credentials
  try {
    credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT)
  } catch (e) {
    throw new Error('Variable GOOGLE_SERVICE_ACCOUNT invalide ou manquante sur le serveur')
  }
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  })
  return google.drive({ version: 'v3', auth })
}

// Multer en mémoire
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'video/mp4', 'image/jpeg', 'image/png']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Seuls les PDF, vidéos et images sont acceptés'))
  }
})

// Rôles par concours
const ROLES_INPHB  = ['etudiant_inphb', 'etudiant_both', 'etudiant_inphb_cme', 'etudiant_all']
const ROLES_ESATIC = ['etudiant_esatic', 'etudiant_both', 'etudiant_esatic_cme', 'etudiant_all']
const ROLES_CME    = ['etudiant_cme', 'etudiant_inphb_cme', 'etudiant_esatic_cme', 'etudiant_all']

function peutAcceder(role, concours) {
  if (role === 'admin' || role === 'professeur') return true
  if (concours === 'tous') return true
  if (concours === 'INP-HB') return ROLES_INPHB.includes(role)
  if (concours === 'ESATIC') return ROLES_ESATIC.includes(role)
  if (concours === 'CME') return ROLES_CME.includes(role)
  return false
}

// ══════════════════════════════════════════
// GET — Liste des ressources (sans URL Drive)
// ══════════════════════════════════════════
router.get('/', verifyToken, async (req, res) => {
  try {
    const { role } = req.user
    let query = supabase
      .from('ressources')
      .select('id, titre, description, type, matiere, concours, visible, created_at, professeur:professeur_id(username, prenom, nom)')
      .eq('visible', true)
      .order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) return res.status(500).json({ message: error.message })

    // Filtrer selon le concours de l'élève — ne jamais exposer drive_file_id
    const filtrees = data.filter(r => peutAcceder(role, r.concours))
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
// Le fichier est streamé depuis Drive directement
// L'élève ne voit jamais l'URL Drive
// ══════════════════════════════════════════
router.get('/ouvrir/:id', verifyToken, async (req, res) => {
  try {
    // Récupérer la ressource avec l'ID Drive (jamais exposé au front)
    const { data: ressource, error } = await supabase
      .from('ressources')
      .select('id, titre, type, concours, visible, drive_file_id')
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
    if (!ressource.drive_file_id) {
      return res.status(404).json({ message: 'Fichier non trouvé dans le stockage' })
    }

    const drive = getDriveClient()

    // Récupérer les métadonnées du fichier
    const fileMeta = await drive.files.get({
      fileId: ressource.drive_file_id,
      fields: 'name, mimeType'
    })

    const mimeType = fileMeta.data.mimeType || 'application/pdf'
    const fileName = encodeURIComponent(ressource.titre || fileMeta.data.name || 'document')

    // Headers pour afficher dans le navigateur (pas télécharger)
    res.setHeader('Content-Type', mimeType)
    res.setHeader('Content-Disposition', `inline; filename="${fileName}.pdf"`)
    res.setHeader('Cache-Control', 'private, no-store')
    res.setHeader('X-Frame-Options', 'SAMEORIGIN')

    // Streamer le fichier depuis Drive vers l'élève
    const fileStream = await drive.files.get(
      { fileId: ressource.drive_file_id, alt: 'media' },
      { responseType: 'stream' }
    )

    fileStream.data.pipe(res)
    fileStream.data.on('error', (err) => {
      console.error('Erreur stream:', err)
      if (!res.headersSent) res.status(500).end()
    })

  } catch (err) {
    console.error('Erreur ouverture:', err)
    if (!res.headersSent) res.status(500).json({ message: 'Erreur serveur' })
  }
})

// ══════════════════════════════════════════
// POST — Upload d'un document par le prof
// Stocké sur Google Drive, ID dans Supabase
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

    // Upload sur Google Drive
    const drive = getDriveClient()
    const bufferStream = new Readable()
    bufferStream.push(req.file.buffer)
    bufferStream.push(null)

    const ext = req.file.originalname.split('.').pop()
    const nomFichier = `${Date.now()}-${titre.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`

    const uploadResponse = await drive.files.create({
      requestBody: {
        name: nomFichier,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
      },
      media: {
        mimeType: req.file.mimetype,
        body: bufferStream,
      },
      fields: 'id, name',
    })

    const driveFileId = uploadResponse.data.id

    // Sauvegarder dans Supabase — uniquement les métadonnées + ID Drive
    const { data, error } = await supabase
      .from('ressources')
      .insert([{
        titre,
        description: description || null,
        type: type || 'pdf',
        matiere,
        concours,
        drive_file_id: driveFileId,
        url: null,
        professeur_id,
        visible: true
      }])
      .select('id, titre, type, matiere, concours, visible, created_at')
      .single()

    if (error) {
      await drive.files.delete({ fileId: driveFileId }).catch(() => {})
      return res.status(500).json({ message: error.message })
    }

    res.json({ success: true, ressource: data })
  } catch (err) {
    console.error('Erreur upload:', err)
    res.status(500).json({ message: `Erreur upload : ${err.message}` })
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
// DELETE — Supprimer (Supabase + Drive)
// ══════════════════════════════════════════
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (!['professeur', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    const { data: ressource } = await supabase
      .from('ressources')
      .select('drive_file_id')
      .eq('id', req.params.id)
      .single()

    // Supprimer de Google Drive
    if (ressource?.drive_file_id) {
      try {
        const drive = getDriveClient()
        await drive.files.delete({ fileId: ressource.drive_file_id })
      } catch (e) {
        console.error('Erreur suppression Drive:', e)
      }
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