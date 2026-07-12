import express from 'express'
import bcrypt from 'bcryptjs'
import supabase from '../supabase.js'
import { verifyToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// ══════════════════════════════════════════
// Génère un matricule séquentiel : 26GEN0001
// Année 2 chiffres + GEN + numéro sur 4 chiffres
// Basé sur le nombre total d'étudiants en base
// ══════════════════════════════════════════
async function genererMatricule() {
  const annee = new Date().getFullYear().toString().slice(-2)

  // Compter TOUS les étudiants existants (peu importe le rôle)
  const { count, error } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .like('role', 'etudiant%')

  if (error) throw new Error('Impossible de générer le matricule')

  // Le prochain numéro = count + 1, formaté sur 4 chiffres
  const numero = String((count || 0) + 1).padStart(4, '0')
  return `${annee}GEN${numero}`
}

// ══════════════════════════════════════════
// GET /api/users/me
// ══════════════════════════════════════════
router.get('/me', verifyToken, async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, matricule, username, nom, prenom, role, concours, modalite, created_at')
    .eq('id', req.user.id)
    .single()

  if (error) return res.status(404).json({ message: 'Utilisateur non trouvé' })
  res.json(user)
})

// ══════════════════════════════════════════
// POST /api/users/create — Créer un utilisateur
// Génère automatiquement le matricule séquentiel
// Accepte la modalité (en_ligne / presentiel)
// ══════════════════════════════════════════
router.post('/create', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé' })
  }

  const { username, password, nom, prenom, role, concours, modalite } = req.body

  if (!username || !password) {
    return res.status(400).json({ message: 'Identifiant et mot de passe sont requis' })
  }

  // Valider la modalité uniquement pour les étudiants
  const estEtudiant = role?.startsWith('etudiant')
  if (estEtudiant && !['en_ligne', 'presentiel'].includes(modalite)) {
    return res.status(400).json({ message: 'La modalité (en ligne ou présentiel) est requise pour un étudiant' })
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    // Générer le matricule séquentiel uniquement pour les étudiants
    let matricule = null
    if (estEtudiant) {
      matricule = await genererMatricule()
    }

    // Si pas de username fourni, le matricule devient l'identifiant de connexion
    const usernameEffectif = username || matricule

    const { data, error } = await supabase
      .from('users')
      .insert([{
        username: usernameEffectif,
        password: hashedPassword,
        nom: nom || null,
        prenom: prenom || null,
        role: role || 'etudiant_inphb',
        concours: concours || 'aucun',
        matricule,
        modalite: estEtudiant ? modalite : null
      }])
      .select('id, matricule, username, nom, prenom, role, concours, modalite, created_at')

    if (error) return res.status(400).json({ message: error.message })
    res.status(201).json({ message: 'Utilisateur créé', user: data[0] })

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// ══════════════════════════════════════════
// GET /api/users/all — Liste tous les utilisateurs
// ══════════════════════════════════════════
router.get('/all', verifyToken, async (req, res) => {
  if (!['admin', 'professeur'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Accès refusé' })
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, matricule, username, nom, prenom, role, concours, modalite, created_at')
    .order('created_at', { ascending: true })

  if (error) return res.status(500).json({ message: error.message })
  res.json({ users: data })
})

// ══════════════════════════════════════════
// DELETE /api/users/:id
// ══════════════════════════════════════════
router.delete('/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé' })
  }
  const { error } = await supabase.from('users').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ message: error.message })
  res.json({ success: true })
})

// ══════════════════════════════════════════
// PATCH /api/users/:id — Modifier un utilisateur
// ══════════════════════════════════════════
router.patch('/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé' })
  }

  const { nom, prenom, role, concours, password, modalite } = req.body
  const updates = {}
  if (nom) updates.nom = nom
  if (prenom) updates.prenom = prenom
  if (role) updates.role = role
  if (concours) updates.concours = concours
  if (modalite) updates.modalite = modalite
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