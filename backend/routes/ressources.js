import express from 'express'
import multer from 'multer'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '../middleware/authMiddleware.js'
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// Multer en mémoire pour upload vers Supabase Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'video/mp4', 'video/mpeg', 'image/jpeg', 'image/png']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Type de fichier non autorisé'))
  }
})

// GET — Récupérer les ressources selon le rôle
router.get('/', verifyToken, async (req, res) => {
  try {
    const { role, concours } = req.user

    let query = supabase
      .from('ressources')
      .select('*, professeur:professeur_id(username, prenom, nom)')
      .eq('visible', true)
      .order('created_at', { ascending: false })

    // Filtrer selon le rôle
    if (role === 'etudiant_inphb') {
      query = query.in('concours', ['INP-HB', 'tous'])
    } else if (role === 'etudiant_esatic') {
      query = query.in('concours', ['ESATIC', 'tous'])
    } else if (role === 'etudiant_both') {
      // Accès à tout
    }
    // professeur et admin voient tout

    const { data, error } = await query
    if (error) return res.status(500).json({ message: error.message })

    res.json({ ressources: data })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// POST — Uploader une ressource (prof et admin uniquement)
router.post('/upload', verifyToken, upload.single('fichier'), async (req, res) => {
  try {
    const { role, id: professeur_id } = req.user

    if (!['professeur', 'admin'].includes(role)) {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    const { titre, description, type, matiere, concours, lien } = req.body
    let url = lien || null

    // Si fichier uploadé
    if (req.file) {
      const ext = req.file.originalname.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const bucket = type === 'video' ? 'videos' : 'ressources'

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype
        })

      if (uploadError) return res.status(500).json({ message: uploadError.message })

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName)
      url = urlData.publicUrl
    }

    const { data, error } = await supabase
      .from('ressources')
      .insert([{ titre, description, type, matiere, concours, url, professeur_id, visible: true }])
      .select()
      .single()

    if (error) return res.status(500).json({ message: error.message })

    res.json({ success: true, ressource: data })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// PATCH — Rendre visible/invisible une ressource
router.patch('/:id/visibilite', verifyToken, async (req, res) => {
  try {
    const { role } = req.user
    if (!['professeur', 'admin'].includes(role)) {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    const { visible } = req.body
    const { data, error } = await supabase
      .from('ressources')
      .update({ visible })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) return res.status(500).json({ message: error.message })
    res.json({ success: true, ressource: data })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// DELETE — Supprimer une ressource
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { role } = req.user
    if (!['professeur', 'admin'].includes(role)) {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    const { error } = await supabase
      .from('ressources')
      .delete()
      .eq('id', req.params.id)

    if (error) return res.status(500).json({ message: error.message })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

export default router