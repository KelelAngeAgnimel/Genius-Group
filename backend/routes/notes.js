import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '../middleware/authMiddleware.js'
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// POST — Ajouter ou modifier une note (prof et admin)
router.post('/ajouter', verifyToken, async (req, res) => {
  try {
    const { role, id: professeur_id } = req.user

    if (!['professeur', 'admin'].includes(role)) {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    const { etudiant_id, matiere, concours, note, periode } = req.body

    if (!etudiant_id || !matiere || !concours || note === undefined || !periode) {
      return res.status(400).json({ message: 'Tous les champs sont obligatoires' })
    }

    if (note < 0 || note > 20) {
      return res.status(400).json({ message: 'La note doit être entre 0 et 20' })
    }

    // Vérifier si une note existe déjà pour cet étudiant/matière/période
    const { data: existing } = await supabase
      .from('notes')
      .select('id')
      .eq('etudiant_id', etudiant_id)
      .eq('matiere', matiere)
      .eq('concours', concours)
      .eq('periode', periode)
      .single()

    let data, error

    if (existing) {
      // Mettre à jour la note existante
      const result = await supabase
        .from('notes')
        .update({ note, professeur_id })
        .eq('id', existing.id)
        .select()
        .single()
      data = result.data
      error = result.error
    } else {
      // Créer une nouvelle note
      const result = await supabase
        .from('notes')
        .insert([{ etudiant_id, matiere, concours, note, periode, professeur_id }])
        .select()
        .single()
      data = result.data
      error = result.error
    }

    if (error) return res.status(500).json({ message: error.message })
    res.json({ success: true, note: data })

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// GET — Mes notes (étudiant connecté)
router.get('/mes-notes', verifyToken, async (req, res) => {
  try {
    const { id, role } = req.user

    if (!role.startsWith('etudiant')) {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    const { data, error } = await supabase
      .from('notes')
      .select('*, professeur:professeur_id(username, prenom, nom)')
      .eq('etudiant_id', id)
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ message: error.message })
    res.json({ notes: data })

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// GET — Notes d'un étudiant spécifique (prof et admin)
router.get('/etudiant/:id', verifyToken, async (req, res) => {
  try {
    const { role } = req.user

    if (!['professeur', 'admin'].includes(role)) {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    const { data, error } = await supabase
      .from('notes')
      .select('*, professeur:professeur_id(username, prenom, nom)')
      .eq('etudiant_id', req.params.id)
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ message: error.message })
    res.json({ notes: data })

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// GET — Toutes les notes d'une classe (prof et admin)
router.get('/classe', verifyToken, async (req, res) => {
  try {
    const { role } = req.user

    if (!['professeur', 'admin'].includes(role)) {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    const { concours, matiere, periode } = req.query

    let query = supabase
      .from('notes')
      .select('*, etudiant:etudiant_id(id, username, prenom, nom, matricule, role), professeur:professeur_id(username, prenom, nom)')
      .order('created_at', { ascending: false })

    if (concours) query = query.eq('concours', concours)
    if (matiere) query = query.eq('matiere', matiere)
    if (periode) query = query.eq('periode', periode)

    const { data, error } = await query

    if (error) return res.status(500).json({ message: error.message })
    res.json({ notes: data })

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// DELETE — Supprimer une note (admin seulement)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { role } = req.user

    if (role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', req.params.id)

    if (error) return res.status(500).json({ message: error.message })
    res.json({ success: true })

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

export default router