import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import supabase from '../supabase.js'

const router = express.Router()

// POST /api/auth/login — connexion par MATRICULE + mot de passe
// Les profs et admins se connectent par username
// Les étudiants se connectent par matricule
router.post('/login', async (req, res) => {
  const { matricule, password } = req.body

  if (!matricule || !password) {
    return res.status(400).json({ message: 'Matricule et mot de passe requis' })
  }

  try {
    // Chercher d'abord par matricule (étudiants)
    // puis par username (profs et admins qui n'ont pas de matricule)
    let user = null

    const { data: parMatricule } = await supabase
      .from('users')
      .select('*')
      .eq('matricule', matricule)
      .single()

    if (parMatricule) {
      user = parMatricule
    } else {
      // Fallback : connexion par username pour profs/admins
      const { data: parUsername } = await supabase
        .from('users')
        .select('*')
        .eq('username', matricule) // le champ "matricule" du body peut contenir un username
        .single()
      user = parUsername
    }

    if (!user) {
      return res.status(401).json({ message: 'Matricule ou identifiant incorrect' })
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ message: 'Mot de passe incorrect' })
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        matricule: user.matricule,
        concours: user.concours,
        modalite: user.modalite
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
        concours: user.concours,
        modalite: user.modalite
      }
    })

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Token manquant' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(403).json({ message: 'Token invalide' })
  }
}

export default router