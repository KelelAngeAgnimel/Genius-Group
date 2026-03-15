import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import supabase from '../supabase.js'

const router = express.Router()

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()

    if (error || !user) {
      return res.status(401).json({ message: 'Identifiant incorrect' })
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ message: 'Mot de passe incorrect' })
    }

    // Token avec role et concours
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        matricule: user.matricule,
        concours: user.concours
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        matricule: user.matricule,
        username: user.username,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        concours: user.concours
      }
    })

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

export default router