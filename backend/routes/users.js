import express from 'express'
import bcrypt from 'bcryptjs'
import supabase from '../supabase.js'
import authMiddleware from '../middleware/authMiddleware.js'

const router = express.Router()

// GET /api/users/me — récupère le profil de l'utilisateur connecté
router.get('/me', authMiddleware, async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, matricule, username, nom, prenom, role, created_at')
    .eq('id', req.user.id)
    .single()

  if (error) return res.status(404).json({ message: 'Utilisateur non trouvé' })
  res.json(user)
})

// POST /api/users/create — créer un utilisateur (admin seulement)
router.post('/create', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé' })
  }

  const { username, password, nom, prenom, role } = req.body

  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    const { data, error } = await supabase
      .from('users')
      .insert([{ username, password: hashedPassword, nom, prenom, role: role || 'etudiant' }])
      .select()

    if (error) return res.status(400).json({ message: error.message })
    res.status(201).json({ message: 'Utilisateur créé ✅', user: data[0] })

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// GET /api/users/all — liste tous les utilisateurs (admin seulement)
router.get('/all', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé' })
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, matricule, username, nom, prenom, role, created_at')
    .order('created_at', { ascending: true })

  if (error) return res.status(500).json({ message: error.message })
  res.json(data)
})

export default router