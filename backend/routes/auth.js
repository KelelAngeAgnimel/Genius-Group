import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import supabase from '../supabase.js'
import { validate } from '../middleware/validate.js'
import { loginLimiter } from '../middleware/rateLimit.js'
import { avecConcoursUn } from '../lib/inscriptions.js'
import { IDENTIFIANT_VALIDE } from '../lib/identifiant.js'

const router = express.Router()

const champIdentifiant = z.string().trim().min(1).max(64).regex(IDENTIFIANT_VALIDE)

// `identifiant` (nouveau) ou `matricule` (ancien nom, toujours accepté) : l'un des deux est obligatoire
// Deux blocs combinés : l'identifiant est contrôlé avant le mot de passe (ordre des messages d'erreur)
const loginSchema = z.object({
  identifiant: champIdentifiant.optional(),
  matricule: champIdentifiant.optional()
}).refine(
  (d) => d.identifiant !== undefined || d.matricule !== undefined,
  { path: ['identifiant'], message: 'Identifiant requis' }
).and(z.object({
  password: z.string().min(1).max(200)
}))

// Hash factice : on compare toujours un mot de passe, même si l'utilisateur n'existe pas
// (évite de deviner les matricules existants par le temps de réponse).
const FAUX_HASH = bcrypt.hashSync('mot-de-passe-factice', 10)
const MSG_IDENTIFIANTS = 'Identifiant ou mot de passe incorrect'

// POST /api/auth/login — connexion par IDENTIFIANT + mot de passe
// Étudiant : l'identifiant est son numéro d'inscription (users.matricule = users.username)
// Professeur / admin : l'identifiant est son username
// Le limiteur lit req.body.identifiant (ou matricule) : il doit passer après express.json (déjà monté dans server.js)
router.post('/login', loginLimiter, validate(loginSchema), async (req, res) => {
  const { password } = req.body
  const identifiant = req.body.identifiant ?? req.body.matricule

  // Chercher d'abord par matricule (étudiants), puis par username (profs et admins)
  let { data: utilisateur, error } = await supabase
    .from('users')
    .select('*')
    .eq('matricule', identifiant)
    .maybeSingle()
  if (error) throw error

  if (!utilisateur) {
    const res2 = await supabase
      .from('users')
      .select('*')
      .eq('username', identifiant)
      .maybeSingle()
    if (res2.error) throw res2.error
    utilisateur = res2.data
  }

  const validPassword = await bcrypt.compare(password, utilisateur?.password || FAUX_HASH)
  if (!utilisateur || !validPassword) {
    return res.status(401).json({ message: MSG_IDENTIFIANTS, error: MSG_IDENTIFIANTS })
  }

  // Rôle normalisé (etudiant / professeur / admin) + liste des concours
  const user = await avecConcoursUn(utilisateur)

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
