import jwt from 'jsonwebtoken'
import supabase from '../supabase.js'
import { avecConcoursUn } from '../lib/inscriptions.js'
import { estEtudiant as estEtudiantRole } from '../lib/concours.js'

// Cache mémoire des utilisateurs (60 s) pour éviter une requête Supabase par appel.
// Il est vidé pour un utilisateur dès que l'admin le modifie ou le supprime.
const TTL_MS = 60 * 1000
const cache = new Map() // id -> { user, expire }

export function invalidateUserCache(id) {
  if (id) cache.delete(String(id))
  else cache.clear()
}

async function chargerUtilisateur(id) {
  const cle = String(id)
  const enCache = cache.get(cle)
  if (enCache && enCache.expire > Date.now()) return enCache.user

  const { data, error } = await supabase
    .from('users')
    .select('id, matricule, username, role, modalite, bloque')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    cache.delete(cle)
    return null
  }
  // Rôle normalisé (etudiant) + liste des concours (inscriptions, sinon ancien rôle)
  const user = await avecConcoursUn(data)
  cache.set(cle, { user, expire: Date.now() + TTL_MS })
  return user
}

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'Token manquant', error: 'Token manquant' })

  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })
  } catch {
    return res.status(401).json({ message: 'Session expirée ou invalide', error: 'Session expirée ou invalide' })
  }

  // Toujours se fier à la base, pas au contenu du token (rôle modifié, compte bloqué ou supprimé)
  const user = await chargerUtilisateur(decoded.id)
  if (!user) {
    return res.status(401).json({ message: 'Compte introuvable', error: 'Compte introuvable' })
  }
  if (user.bloque) {
    return res.status(403).json({ message: 'Ce compte a été bloqué. Contactez l\'administration.', error: 'Compte bloqué' })
  }

  req.user = {
    id: user.id,
    matricule: user.matricule,
    username: user.username,
    role: user.role,
    concours: user.concours, // liste de codes : ['inphb', 'ensea']…
    modalite: user.modalite
  }
  next()
}

// Exemple : router.post('/', verifyToken, requireRole('admin', 'professeur'), handler)
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Accès refusé', error: 'Accès refusé' })
  }
  next()
}

export const estEtudiant = estEtudiantRole
