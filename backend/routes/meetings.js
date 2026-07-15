import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from './auth.js'
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// Détermine quels concours un rôle donné peut voir
function concoursAutorises(role) {
  // Personnel : voit tout
  if (role === 'admin' || role === 'professeur') {
    return ['inphb', 'esatic', 'both']
  }
  // Étudiants inscrits aux deux concours (ou aux trois) : voient tout
  if (role === 'etudiant_both' || role === 'etudiant_all') {
    return ['inphb', 'esatic', 'both']
  }
  // INP-HB (seul ou avec CME) : cours INP-HB + cours communs
  if (role === 'etudiant_inphb' || role === 'etudiant_inphb_cme') {
    return ['inphb', 'both']
  }
  // ESATIC (seul ou avec CME) : cours ESATIC + cours communs
  if (role === 'etudiant_esatic' || role === 'etudiant_esatic_cme') {
    return ['esatic', 'both']
  }
  // Par défaut : au moins les cours communs
  return ['both']
}

// GET /api/meetings — cours filtrés selon le concours de l'utilisateur
router.get('/', verifyToken, async (req, res) => {
  try {
    const concours = concoursAutorises(req.user.role)

    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .in('concours', concours)
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/meetings — créer un cours (admin uniquement)
router.post('/', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'professeur') {
    return res.status(403).json({ error: 'Accès réservé aux enseignants' })
  }
  const { titre, prof, heure, lien, concours } = req.body
  if (!titre || !lien) {
    return res.status(400).json({ error: 'Le titre et le lien du cours sont requis' })
  }

  try {
    const { data, error } = await supabase
      .from('meetings')
      .insert([{
        titre,
        prof: prof || null,
        heure: heure || null,
        lien,
        salle: 'externe',
        live: false,
        concours: concours || 'both',
        created_by: req.user.id
      }])
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PATCH /api/meetings/:id — modifier un cours (admin uniquement)
router.patch('/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'professeur') {
    return res.status(403).json({ error: 'Accès réservé aux enseignants' })
  }
  const { titre, prof, heure, lien, concours, live } = req.body
  const updates = {}
  if (titre !== undefined) updates.titre = titre
  if (prof !== undefined) updates.prof = prof
  if (heure !== undefined) updates.heure = heure
  if (lien !== undefined) updates.lien = lien
  if (concours !== undefined) updates.concours = concours
  if (live !== undefined) updates.live = live

  try {
    const { data, error } = await supabase
      .from('meetings')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Cours non trouvé' })
      return res.status(500).json({ error: error.message })
    }
    if (!data) return res.status(404).json({ error: 'Cours non trouvé' })
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/meetings/:id — supprimer un cours (admin uniquement)
router.delete('/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'professeur') {
    return res.status(403).json({ error: 'Accès réservé aux enseignants' })
  }
  try {
    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('id', req.params.id)

    if (error) return res.status(500).json({ error: error.message })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router