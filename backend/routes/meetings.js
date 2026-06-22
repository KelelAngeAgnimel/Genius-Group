import express from 'express'
import pkg from 'pg'
const { Pool } = pkg
import { verifyToken } from './auth.js'

const router = express.Router()
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

// Créer la table si elle n'existe pas
pool.query(`
  CREATE TABLE IF NOT EXISTS meetings (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    prof VARCHAR(255),
    heure VARCHAR(50),
    salle VARCHAR(255) NOT NULL,
    live BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(err => console.error('Erreur création table meetings:', err))

// GET /api/meetings — tous les cours (accessible à tous les rôles connectés)
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM meetings ORDER BY created_at DESC`)
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/meetings — créer un cours (admin uniquement)
router.post('/', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' })
  }
  const { titre, prof, heure, salle, live } = req.body
  if (!titre || !salle) {
    return res.status(400).json({ error: 'titre et salle sont requis' })
  }
  try {
    const result = await pool.query(
      `INSERT INTO meetings (titre, prof, heure, salle, live, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [titre, prof || null, heure || null, salle, live || false, req.user.id]
    )
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PATCH /api/meetings/:id — toggler le statut "live" (admin uniquement)
router.patch('/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' })
  }
  const { live } = req.body
  try {
    const result = await pool.query(
      `UPDATE meetings SET live = $1 WHERE id = $2 RETURNING *`,
      [live, req.params.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cours non trouvé' })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/meetings/:id — supprimer un cours (admin uniquement)
router.delete('/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' })
  }
  try {
    await pool.query(`DELETE FROM meetings WHERE id = $1`, [req.params.id])
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router