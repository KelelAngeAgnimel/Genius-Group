import express from 'express'
import bcrypt from 'bcryptjs'
import supabase from '../supabase.js'
import { z } from 'zod'
import { verifyToken, requireRole, invalidateUserCache } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validate.js'
import { avecConcours, avecConcoursUn, definirInscriptions } from '../lib/inscriptions.js'
import { CODES_CONCOURS, concoursDepuisAncienRole, roleDeBase, peutGererEleve } from '../lib/concours.js'

const router = express.Router()

// Rôles du nouveau modèle ; les anciens rôles combinés restent acceptés (ancien frontend
// pendant le déploiement) et sont convertis en role + concours.
const ROLES = [
  'admin', 'professeur', 'etudiant',
  'etudiant_inphb', 'etudiant_esatic', 'etudiant_inphb_cme', 'etudiant_esatic_cme',
  'etudiant_cme', 'etudiant_both', 'etudiant_all'
]
// `concours` : liste de codes (nouveau) ou chaîne héritée de l'ancien formulaire (ignorée)
const concoursSchema = z.union([z.array(z.enum(CODES_CONCOURS)).max(CODES_CONCOURS.length), z.string().trim().max(50)])
const listeConcours = (v) => (Array.isArray(v) ? v : null)
const nomSchema = z.string().trim().max(100)

const creerSchema = z.object({
  // Vide pour un élève (son identifiant est le matricule généré) : traité comme absent
  username: z.preprocess(v => (typeof v === 'string' && v.trim() === '' ? undefined : v), z.string().trim().min(1).max(64).optional()),
  password: z.string().min(6).max(200),
  nom: nomSchema.nullish(),
  prenom: nomSchema.nullish(),
  role: z.enum(ROLES).optional(),
  concours: concoursSchema.optional(),
  modalite: z.enum(['en_ligne', 'presentiel']).nullish()
})
const modifierSchema = z.object({
  nom: nomSchema.optional(),
  prenom: nomSchema.optional(),
  role: z.enum(ROLES).optional(),
  concours: concoursSchema.optional(),
  modalite: z.enum(['en_ligne', 'presentiel']).optional(),
  password: z.string().min(6).max(200).optional().or(z.literal('')),
  bloque: z.boolean().optional()
})

// ══════════════════════════════════════════
// Génère un matricule : 26GEN0001
// Année 2 chiffres + GEN + numéro sur 4 chiffres
// Choisit le PLUS PETIT numéro libre : réutilise le créneau
// d'un étudiant supprimé et n'entre jamais en collision.
// ══════════════════════════════════════════
async function prochainMatriculeLibre() {
  const annee = new Date().getFullYear().toString().slice(-2)
  const prefixe = `${annee}GEN`

  // Récupérer matricules ET usernames pour repérer TOUS les numéros déjà pris
  const { data, error } = await supabase
    .from('users')
    .select('matricule, username')

  if (error) throw error

  const pris = new Set()
  for (const u of (data || [])) {
    for (const val of [u.matricule, u.username]) {
      if (typeof val === 'string' && val.startsWith(prefixe)) {
        const n = parseInt(val.slice(prefixe.length), 10)
        if (!Number.isNaN(n)) pris.add(n)
      }
    }
  }

  // Plus petit numéro non utilisé (comble le trou laissé par une suppression)
  let numero = 1
  while (pris.has(numero)) numero++
  return { prefixe, numero }
}

// ══════════════════════════════════════════
// GET /api/users/me
// ══════════════════════════════════════════
router.get('/me', verifyToken, async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, matricule, username, nom, prenom, role, modalite, created_at')
    .eq('id', req.user.id)
    .single()

  if (error) return res.status(404).json({ message: 'Utilisateur non trouvé' })
  res.json(await avecConcoursUn(user)) // role normalisé + concours: ['inphb', …]
})

// ══════════════════════════════════════════
// POST /api/users/create — Créer un utilisateur
// Génère automatiquement le matricule séquentiel
// Accepte la modalité (en_ligne / presentiel)
// ══════════════════════════════════════════
router.post('/create', verifyToken, requireRole('admin'), validate(creerSchema), async (req, res) => {
  const { username, password, nom, prenom, modalite } = req.body
  const roleDemande = req.body.role || 'etudiant'
  const role = roleDeBase(roleDemande)
  // Concours choisis (cases à cocher) ; à défaut, déduits d'un ancien rôle combiné
  const concours = listeConcours(req.body.concours) ?? concoursDepuisAncienRole(roleDemande)

  // Pour les profs et admins, le username est obligatoire
  // Pour les étudiants, le matricule généré automatiquement servira d'identifiant
  const estEtudiant = role === 'etudiant'
  if (!estEtudiant && !username) {
    return res.status(400).json({ message: 'L\'identifiant est requis pour les professeurs et administrateurs' })
  }
  if (estEtudiant && concours.length === 0) {
    return res.status(400).json({ message: 'Choisissez au moins un concours pour un étudiant' })
  }
  if (estEtudiant && !['en_ligne', 'presentiel'].includes(modalite)) {
    return res.status(400).json({ message: 'La modalité (en ligne ou présentiel) est requise pour un étudiant' })
  }

  {
    const hashedPassword = await bcrypt.hash(password, 10)

    const champsCommuns = {
      password: hashedPassword,
      nom: nom || null,
      prenom: prenom || null,
      role,
      concours: 'aucun', // colonne héritée, remplacée par la table inscriptions
      modalite: estEtudiant ? modalite : null,
    }
    const champsSelect = 'id, matricule, username, nom, prenom, role, modalite, created_at'

    // Profs / admins : username fourni manuellement, pas de matricule
    if (!estEtudiant) {
      const { data, error } = await supabase
        .from('users')
        .insert([{ ...champsCommuns, username, matricule: null }])
        .select(champsSelect)

      if (error) return erreurCreation(res, error)
      await definirInscriptions(data[0].id, concours)
      return res.status(201).json({ message: 'Utilisateur créé', user: await avecConcoursUn(data[0]) })
    }

    // Étudiants : le matricule sert d'identifiant. On part du plus petit
    // numéro libre, et si jamais il est déjà pris (course entre deux
    // créations, ancien username, etc.) on tente automatiquement le suivant.
    const { prefixe, numero: depart } = await prochainMatriculeLibre()

    for (let numero = depart; numero < depart + 100; numero++) {
      const matricule = `${prefixe}${String(numero).padStart(4, '0')}`
      const { data, error } = await supabase
        .from('users')
        .insert([{ ...champsCommuns, username: matricule, matricule }])
        .select(champsSelect)

      if (!error) {
        await definirInscriptions(data[0].id, concours)
        return res.status(201).json({ message: 'Utilisateur créé', user: await avecConcoursUn(data[0]) })
      }
      // 23505 = violation d'unicité → ce numéro est pris, on essaie le suivant
      if (error.code === '23505') continue
      return erreurCreation(res, error)
    }

    return res.status(500).json({ message: 'Impossible de générer un identifiant libre' })
  }
})

// Ne renvoie jamais le message brut de la base
function erreurCreation(res, error) {
  console.error('Erreur création utilisateur:', error)
  if (error.code === '23505') return res.status(400).json({ message: 'Cet identifiant existe déjà' })
  return res.status(400).json({ message: 'Création impossible : vérifiez les informations saisies' })
}

// ══════════════════════════════════════════
// GET /api/users/all — Liste tous les utilisateurs
// ══════════════════════════════════════════
router.get('/all', verifyToken, requireRole('admin', 'professeur'), async (req, res) => {
  let query = supabase
    .from('users')
    .select('id, matricule, username, nom, prenom, role, modalite, bloque, created_at')
    .order('created_at', { ascending: true })

  // Un professeur ne voit que les élèves (ni admins, ni autres professeurs)
  if (req.user.role === 'professeur') query = query.like('role', 'etudiant%')

  const { data, error } = await query
  if (error) throw error
  const users = await avecConcours(data)
  // Un professeur rattaché à des concours ne voit que les élèves de ces concours
  res.json({ users: req.user.role === 'professeur' ? users.filter(u => peutGererEleve(req.user, u)) : users })
})

// ══════════════════════════════════════════
// DELETE /api/users/:id
// ══════════════════════════════════════════
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  if (String(req.params.id) === String(req.user.id)) {
    return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' })
  }
  const { error } = await supabase.from('users').delete().eq('id', req.params.id)
  if (error) throw error
  invalidateUserCache(req.params.id)
  res.json({ success: true })
})

// ══════════════════════════════════════════
// PATCH /api/users/:id — Modifier un utilisateur
// ══════════════════════════════════════════
router.patch('/:id', verifyToken, requireRole('admin'), validate(modifierSchema), async (req, res) => {
  const { nom, prenom, password, modalite, bloque } = req.body
  const role = req.body.role ? roleDeBase(req.body.role) : undefined
  // Concours : liste explicite, sinon déduits d'un ancien rôle combiné (ancien frontend)
  const concours = listeConcours(req.body.concours) ?? (req.body.role ? concoursDepuisAncienRole(req.body.role) : [])
  const changerConcours = listeConcours(req.body.concours) !== null || concours.length > 0
  const updates = {}
  if (nom) updates.nom = nom
  if (prenom) updates.prenom = prenom
  if (role) updates.role = role
  if (modalite) updates.modalite = modalite
  if (password) updates.password = await bcrypt.hash(password, 10)
  if (typeof bloque === 'boolean') updates.bloque = bloque

  // Un admin ne peut ni se bloquer ni se retirer son rôle admin
  if (String(req.params.id) === String(req.user.id) && (updates.bloque === true || (updates.role && updates.role !== 'admin'))) {
    return res.status(400).json({ message: 'Action impossible sur votre propre compte' })
  }
  if (Object.keys(updates).length === 0 && !changerConcours) {
    return res.status(400).json({ message: 'Aucune modification fournie' })
  }

  const colonnes = 'id, matricule, username, nom, prenom, role, modalite, bloque, created_at'
  const { data, error } = Object.keys(updates).length > 0
    ? await supabase.from('users').update(updates).eq('id', req.params.id).select(colonnes).maybeSingle()
    : await supabase.from('users').select(colonnes).eq('id', req.params.id).maybeSingle()

  if (error) throw error
  if (!data) return res.status(404).json({ message: 'Utilisateur non trouvé' })
  if (changerConcours) await definirInscriptions(data.id, concours)
  invalidateUserCache(req.params.id)
  res.json({ success: true, user: await avecConcoursUn(data) })
})

export default router