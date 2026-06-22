import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '../middleware/authMiddleware.js'
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// POST /api/exercices — Créer un exercice (prof/admin)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { role, id: professeur_id } = req.user

    if (!['professeur', 'admin'].includes(role)) {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    const { titre, matiere, description, url_fichier, etudiant_id } = req.body
    if (!titre || !matiere || !etudiant_id) {
      return res.status(400).json({ error: 'titre, matiere et etudiant_id sont requis' })
    }

    const { data, error } = await supabase
      .from('exercices')
      .insert([{
        titre,
        matiere,
        description: description || null,
        url_fichier: url_fichier || null,
        etudiant_id,
        professeur_id
      }])
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    res.json({ exercice: data })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/exercices/recus — Exercices reçus par l'étudiant connecté
router.get('/recus', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('exercices')
      .select('*, professeur:professeur_id(username, prenom, nom)')
      .eq('etudiant_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    res.json({ exercices: data })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/exercices/envoyes — Exercices envoyés par le prof connecté
router.get('/envoyes', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('exercices')
      .select('*, etudiant:etudiant_id(username, prenom, nom)')
      .eq('professeur_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    res.json({ exercices: data })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PATCH /api/exercices/:id/statut — Marquer comme fait (étudiant)
router.patch('/:id/statut', verifyToken, async (req, res) => {
  try {
    const { statut } = req.body

    const { error } = await supabase
      .from('exercices')
      .update({ statut })
      .eq('id', req.params.id)
      .eq('etudiant_id', req.user.id)

    if (error) return res.status(500).json({ error: error.message })
    res.json({ success: true })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router