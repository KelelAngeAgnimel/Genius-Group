import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from './auth.js'
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// Détermine quels concours un rôle donné peut voir
function concoursAutorises(role) {
  if (role === 'admin' || role === 'professeur' || role === 'etudiant_both') {
    return ['inphb', 'esatic', 'both']
  }
  if (role === 'etudiant_inphb') return ['inphb', 'both']
  if (role === 'etudiant_esatic') return ['esatic', 'both']
  return ['both']
}

// GET /api/planning — cours visibles selon le rôle de l'utilisateur connecté
router.get('/', verifyToken, async (req, res) => {
  try {
    const concours = concoursAutorises(req.user.role)

    const { data, error } = await supabase
      .from('cours_planning')
      .select(`
        id, jour, heure_debut, heure_fin, matiere, type, salle, concours, professeur_id, created_at,
        professeur:professeur_id ( id, nom, prenom )
      `)
      .in('concours', concours)
      .order('jour')
      .order('heure_debut')

    if (error) return res.status(500).json({ error: error.message })

    const enrichi = (data || []).map(c => ({
      ...c,
      prof: c.professeur ? `${c.professeur.prenom} ${c.professeur.nom}` : null
    }))

    res.json(enrichi)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/planning — créer un cours (admin uniquement)
router.post('/', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' })
  }
  const { jour, heure_debut, heure_fin, matiere, type, salle, concours, professeur_id } = req.body

  if (!jour || !heure_debut || !heure_fin || !matiere) {
    return res.status(400).json({ error: 'jour, heure_debut, heure_fin et matiere sont requis' })
  }

  try {
    const { data, error } = await supabase
      .from('cours_planning')
      .insert([{
        jour,
        heure_debut,
        heure_fin,
        matiere,
        type: type || 'cours',
        salle: salle || null,
        concours: concours || 'both',
        professeur_id: professeur_id || null,
        created_by: req.user.id
      }])
      .select(`
        id, jour, heure_debut, heure_fin, matiere, type, salle, concours, professeur_id, created_at,
        professeur:professeur_id ( id, nom, prenom )
      `)
      .single()

    if (error) return res.status(500).json({ error: error.message })

    res.json({ ...data, prof: data.professeur ? `${data.professeur.prenom} ${data.professeur.nom}` : null })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PATCH /api/planning/:id — modifier un cours (admin uniquement)
router.patch('/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' })
  }
  const { jour, heure_debut, heure_fin, matiere, type, salle, concours, professeur_id } = req.body
  const updates = {}
  if (jour !== undefined) updates.jour = jour
  if (heure_debut !== undefined) updates.heure_debut = heure_debut
  if (heure_fin !== undefined) updates.heure_fin = heure_fin
  if (matiere !== undefined) updates.matiere = matiere
  if (type !== undefined) updates.type = type
  if (salle !== undefined) updates.salle = salle
  if (concours !== undefined) updates.concours = concours
  if (professeur_id !== undefined) updates.professeur_id = professeur_id || null

  try {
    const { data, error } = await supabase
      .from('cours_planning')
      .update(updates)
      .eq('id', req.params.id)
      .select(`
        id, jour, heure_debut, heure_fin, matiere, type, salle, concours, professeur_id, created_at,
        professeur:professeur_id ( id, nom, prenom )
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Cours non trouvé' })
      return res.status(500).json({ error: error.message })
    }

    res.json({ ...data, prof: data.professeur ? `${data.professeur.prenom} ${data.professeur.nom}` : null })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/planning/:id — supprimer un cours (admin uniquement)
router.delete('/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' })
  }
  try {
    const { error } = await supabase
      .from('cours_planning')
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