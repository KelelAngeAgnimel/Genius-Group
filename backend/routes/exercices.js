import express from 'express'
import pkg from 'pg'
const { Pool } = pkg
import { verifyToken } from './auth.js'

const router = express.Router()
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

// Créer la table si elle n'existe pas
pool.query(`
  CREATE TABLE IF NOT EXISTS exercices (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    matiere VARCHAR(100) NOT NULL,
    description TEXT,
    url_fichier TEXT,
    etudiant_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    professeur_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    statut VARCHAR(20) DEFAULT 'en_attente',
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(err => console.error('Erreur création table exercices:', err))

// POST /api/exercices — Créer un exercice (prof/admin)
router.post('/', verifyToken, async (req, res) => {
  const { titre, matiere, description, url_fichier, etudiant_id } = req.body
  if (!titre || !matiere || !etudiant_id) {
    return res.status(400).json({ error: 'titre, matiere et etudiant_id sont requis' })
  }
  try {
    const result = await pool.query(
      `INSERT INTO exercices (titre, matiere, description, url_fichier, etudiant_id, professeur_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [titre, matiere, description || null, url_fichier || null, etudiant_id, req.user.id]
    )
    res.json({ exercice: result.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/exercices/recus — Exercices reçus par l'étudiant connecté
router.get('/recus', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, u.username as professeur_nom, u.prenom as professeur_prenom
       FROM exercices e
       LEFT JOIN users u ON e.professeur_id = u.id
       WHERE e.etudiant_id = $1
       ORDER BY e.created_at DESC`,
      [req.user.id]
    )
    res.json({ exercices: result.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/exercices/envoyes — Exercices envoyés par le prof connecté
router.get('/envoyes', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, u.username as etudiant_nom, u.prenom as etudiant_prenom
       FROM exercices e
       LEFT JOIN users u ON e.etudiant_id = u.id
       WHERE e.professeur_id = $1
       ORDER BY e.created_at DESC`,
      [req.user.id]
    )
    res.json({ exercices: result.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PATCH /api/exercices/:id/statut — Marquer comme fait
router.patch('/:id/statut', verifyToken, async (req, res) => {
  const { statut } = req.body
  try {
    await pool.query(
      `UPDATE exercices SET statut = $1 WHERE id = $2 AND etudiant_id = $3`,
      [statut, req.params.id, req.user.id]
    )
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router