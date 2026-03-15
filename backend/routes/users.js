import express from 'express'
import bcrypt from 'bcryptjs'
import supabase from '../supabase.js'
import { verifyToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// GET /api/users/me
router.get('/me', verifyToken, async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, matricule, username, nom, prenom, role, concours, created_at')
    .eq('id', req.user.id)
    .single()

  if (error) return res.status(404).json({ message: 'Utilisateur non trouvé' })
  res.json(user)
})

// POST /api/users/create — créer un utilisateur (admin seulement)
router.post('/create', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé' })
  }

  const { username, password, nom, prenom, role, concours } = req.body

  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    const { data, error } = await supabase
      .from('users')
      .insert([{
        username,
        password: hashedPassword,
        nom,
        prenom,
        role: role || 'etudiant_inphb',
        concours: concours || 'aucun'
      }])
      .select()

    if (error) return res.status(400).json({ message: error.message })
    res.status(201).json({ message: 'Utilisateur créé', user: data[0] })

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// GET /api/users/all — liste tous les utilisateurs (admin et professeur)
router.get('/all', verifyToken, async (req, res) => {
  if (!['admin', 'professeur'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Accès refusé' })
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, matricule, username, nom, prenom, role, concours, created_at')
    .order('created_at', { ascending: true })

  if (error) return res.status(500).json({ message: error.message })
  res.json({ users: data })
})

// DELETE /api/users/:id — supprimer un utilisateur (admin seulement)
router.delete('/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé' })
  }

  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', req.params.id)

  if (error) return res.status(500).json({ message: error.message })
  res.json({ success: true })
})

// PATCH /api/users/:id — modifier un utilisateur (admin seulement)
router.patch('/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé' })
  }

  const { nom, prenom, role, concours, password } = req.body
  const updates = {}

  if (nom) updates.nom = nom
  if (prenom) updates.prenom = prenom
  if (role) updates.role = role
  if (concours) updates.concours = concours
  if (password) updates.password = await bcrypt.hash(password, 10)

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) return res.status(500).json({ message: error.message })
  res.json({ success: true, user: data })
})

export default router