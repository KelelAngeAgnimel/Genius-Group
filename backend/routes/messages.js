import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '../middleware/authMiddleware.js'
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// GET — Mes messages reçus
router.get('/recus', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*, expediteur:de_id(username, prenom, nom, role)')
      .eq('a_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ message: error.message })
    res.json({ messages: data })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// GET — Mes messages envoyés
router.get('/envoyes', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*, destinataire:a_id(username, prenom, nom, role)')
      .eq('de_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ message: error.message })
    res.json({ messages: data })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// POST — Envoyer un message
router.post('/envoyer', verifyToken, async (req, res) => {
  try {
    const { a_id, sujet, contenu } = req.body

    const { data, error } = await supabase
      .from('messages')
      .insert([{ de_id: req.user.id, a_id, sujet, contenu }])
      .select()
      .single()

    if (error) return res.status(500).json({ message: error.message })
    res.json({ success: true, message: data })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// PATCH — Marquer comme lu
router.patch('/:id/lu', verifyToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ lu: true })
      .eq('id', req.params.id)
      .eq('a_id', req.user.id)

    if (error) return res.status(500).json({ message: error.message })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// POST — Diffuser un message à un groupe d'étudiants
// groupe : 'tous' | 'inphb' | 'esatic' | 'all'
router.post('/diffuser', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'professeur') {
    return res.status(403).json({ message: 'Accès réservé aux enseignants' })
  }
  try {
    const { groupe, sujet, contenu } = req.body
    if (!sujet || !contenu) {
      return res.status(400).json({ message: 'Sujet et message requis' })
    }

    // Récupérer tous les étudiants
    const { data: etudiants, error: errE } = await supabase
      .from('users')
      .select('id, role')
      .like('role', 'etudiant%')

    if (errE) return res.status(500).json({ message: errE.message })

    // Filtrer selon le groupe ciblé (un étudiant "all" fait aussi INP-HB et ESATIC)
    const cibles = (etudiants || []).filter(u => {
      const r = u.role || ''
      if (groupe === 'inphb')  return r.includes('inphb') || r === 'etudiant_both' || r === 'etudiant_all'
      if (groupe === 'esatic') return r.includes('esatic') || r === 'etudiant_both' || r === 'etudiant_all'
      if (groupe === 'all')    return r === 'etudiant_all'
      return true // 'tous'
    })

    if (cibles.length === 0) {
      return res.json({ success: true, count: 0 })
    }

    const lignes = cibles.map(e => ({ de_id: req.user.id, a_id: e.id, sujet, contenu }))
    const { error } = await supabase.from('messages').insert(lignes)
    if (error) return res.status(500).json({ message: error.message })

    res.json({ success: true, count: lignes.length })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

export default router