import express from 'express'
import multer from 'multer'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '../middleware/authMiddleware.js'
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// Multer en mémoire
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
    const { role } = req.user

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
    }
    // etudiant_both, professeur et admin voient tout

    const { data, error } = await query
    if (error) return res.status(500).json({ message: error.message })

    // Générer des URLs signées pour chaque ressource (valables 1 heure)
    const ressourcesAvecUrls = await Promise.all(
      data.map(async (ressource) => {
        if (!ressource.url) return ressource

        // Extraire le nom du fichier depuis l'URL stockée
        const nomFichier = ressource.url.split('/').pop()
        const bucket = ressource.type === 'video' ? 'videos' : 'ressources'

        try {
          const { data: signedData, error: signedError } = await supabase.storage
            .from(bucket)
            .createSignedUrl(nomFichier, 3600) // 1 heure

          if (signedError) return { ...ressource, urlSigne: null }
          return { ...ressource, urlSigne: signedData.signedUrl }
        } catch {
          return { ...ressource, urlSigne: null }
        }
      })
    )

    res.json({ ressources: ressourcesAvecUrls })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// GET — Toutes les ressources pour prof/admin (même invisibles)
router.get('/toutes', verifyToken, async (req, res) => {
  try {
    const { role } = req.user
    if (!['professeur', 'admin'].includes(role)) {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    const { data, error } = await supabase
      .from('ressources')
      .select('*, professeur:professeur_id(username, prenom, nom)')
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ message: error.message })

    // Générer URLs signées
    const ressourcesAvecUrls = await Promise.all(
      data.map(async (ressource) => {
        if (!ressource.url) return ressource
        const nomFichier = ressource.url.split('/').pop()
        const bucket = ressource.type === 'video' ? 'videos' : 'ressources'
        try {
          const { data: signedData } = await supabase.storage
            .from(bucket)
            .createSignedUrl(nomFichier, 3600)
          return { ...ressource, urlSigne: signedData?.signedUrl || null }
        } catch {
          return { ...ressource, urlSigne: null }
        }
      })
    )

    res.json({ ressources: ressourcesAvecUrls })
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
    let nomFichierStocke = null

    // Si fichier uploadé vers bucket privé
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

      // On stocke uniquement le nom du fichier, pas l'URL publique
      nomFichierStocke = fileName
    }

    // url = nom du fichier si upload, ou lien externe si fourni
    const url = nomFichierStocke || lien || null

    const { data, error } = await supabase
      .from('ressources')
      .insert([{
        titre,
        description,
        type,
        matiere,
        concours,
        url,
        professeur_id,
        visible: true
      }])
      .select()
      .single()

    if (error) return res.status(500).json({ message: error.message })

    res.json({ success: true, ressource: data })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// PATCH — Rendre visible/invisible
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

    // Récupérer la ressource pour supprimer le fichier du storage
    const { data: ressource } = await supabase
      .from('ressources')
      .select('url, type')
      .eq('id', req.params.id)
      .single()

    // Supprimer le fichier du bucket si c'est un upload
    if (ressource?.url && !ressource.url.startsWith('http')) {
      const bucket = ressource.type === 'video' ? 'videos' : 'ressources'
      await supabase.storage.from(bucket).remove([ressource.url])
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