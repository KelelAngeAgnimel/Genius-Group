import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import supabase from '../supabase.js'
import { validate } from '../middleware/validate.js'
import { loginLimiter } from '../middleware/rateLimit.js'

const router = express.Router()

const loginSchema = z.object({
  matricule: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(200)
})

// Hash factice : on compare toujours un mot de passe, même si l'utilisateur n'existe pas
// (évite de deviner les matricules existants par le temps de réponse).
const FAUX_HASH = bcrypt.hashSync('mot-de-passe-factice', 10)
const MSG_IDENTIFIANTS = 'Identifiants incorrects'

// POST /api/auth/login — connexion par MATRICULE + mot de passe
// Les profs et admins se connectent par username
// Les étudiants se connectent par matricule
// Le limiteur lit req.body.matricule : il doit passer après express.json (déjà monté dans server.js)
router.post('/login', loginLimiter, validate(loginSchema), async (req, res) => {
  const { matricule, password } = req.body

  // Chercher d'abord par matricule (étudiants), puis par username (profs et admins)
  let { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('matricule', matricule)
    .maybeSingle()
  if (error) throw error

  if (!user) {
    const res2 = await supabase
      .from('users')
      .select('*')
      .eq('username', matricule) // le champ "matricule" du body peut contenir un username
      .maybeSingle()
    if (res2.error) throw res2.error
    user = res2.data
  }

  const validPassword = await bcrypt.compare(password, user?.password || FAUX_HASH)
  if (!user || !validPassword) {
    return res.status(401).json({ message: MSG_IDENTIFIANTS, error: MSG_IDENTIFIANTS })
  }

  if (user.bloque) {
    return res.status(403).json({ message: 'Ce compte a été bloqué. Contactez l\'administration.' })
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
    { expiresIn: '24h', algorithm: 'HS256' }
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
})

export default router
