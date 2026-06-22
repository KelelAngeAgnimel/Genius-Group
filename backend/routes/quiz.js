import express from 'express'
import pkg from 'pg'
const { Pool } = pkg
import Groq from 'groq-sdk'
import { verifyToken } from './auth.js'

const router = express.Router()
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// ── Création des tables ──────────────────────────────────────────
pool.query(`
  CREATE TABLE IF NOT EXISTS quizzes (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    matiere VARCHAR(100) NOT NULL,
    niveau VARCHAR(50),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ai_genere BOOLEAN DEFAULT false,
    publie BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(err => console.error('Erreur création table quizzes:', err))

pool.query(`
  CREATE TABLE IF NOT EXISTS quiz_questions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    bonne_reponse INTEGER NOT NULL
  )
`).catch(err => console.error('Erreur création table quiz_questions:', err))

pool.query(`
  CREATE TABLE IF NOT EXISTS quiz_resultats (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    etudiant_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    reponses JSONB,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(err => console.error('Erreur création table quiz_resultats:', err))

// ── GET /api/quiz — liste des quiz (adaptée au rôle) ─────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    if (['professeur', 'admin'].includes(req.user.role)) {
      const where = req.user.role === 'admin' ? '' : 'WHERE q.created_by = $1'
      const params = req.user.role === 'admin' ? [] : [req.user.id]
      const result = await pool.query(
        `SELECT q.*,
          (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as nb_questions,
          (SELECT COUNT(*) FROM quiz_resultats WHERE quiz_id = q.id) as nb_tentatives,
          (SELECT ROUND(AVG(score::numeric / total * 100), 1) FROM quiz_resultats WHERE quiz_id = q.id) as moyenne_pct
        FROM quizzes q ${where} ORDER BY q.created_at DESC`,
        params
      )
      res.json({ quizzes: result.rows })
    } else {
      const quizzesRes = await pool.query(
        `SELECT q.*, (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as nb_questions
         FROM quizzes q WHERE q.publie = true ORDER BY q.created_at DESC`
      )
      const resultatsRes = await pool.query(
        `SELECT quiz_id, score, total FROM quiz_resultats WHERE etudiant_id = $1`,
        [req.user.id]
      )
      const map = {}
      resultatsRes.rows.forEach(r => { map[r.quiz_id] = r })
      const quizzes = quizzesRes.rows.map(q => ({
        ...q,
        deja_fait: !!map[q.id],
        score: map[q.id]?.score ?? null,
        total_score: map[q.id]?.total ?? null
      }))
      res.json({ quizzes })
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ── POST /api/quiz/generer-ia — génération IA (sans sauvegarde) ──
router.post('/generer-ia', verifyToken, async (req, res) => {
  if (!['professeur', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Accès réservé aux professeurs et administrateurs' })
  }
  const { matiere, niveau, theme, nombre_questions } = req.body
  const n = Math.min(Math.max(parseInt(nombre_questions) || 5, 1), 20)
  if (!matiere) return res.status(400).json({ error: 'La matière est requise' })

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 4096,
      messages: [
        {
          role: 'system',
          content: 'Tu es un générateur de quiz éducatif. Tu réponds UNIQUEMENT avec un tableau JSON valide, sans aucun texte avant ou après, sans balises markdown. Format exact : [{"question": "texte", "options": ["a","b","c","d"], "bonne_reponse": 0}]. bonne_reponse est l\'index (0 à 3) de la bonne réponse dans options. Génère des questions claires, pertinentes et de niveau adapté.'
        },
        {
          role: 'user',
          content: `Génère ${n} questions de QCM sur la matière "${matiere}"${theme ? ` portant sur le thème : ${theme}` : ''}, niveau ${niveau || 'général'}. Chaque question doit avoir exactement 4 options de réponse.`
        }
      ]
    })

    let raw = completion.choices[0].message.content.trim()
    raw = raw.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim()
    const questions = JSON.parse(raw)

    const valides = questions.filter(q =>
      q.question && Array.isArray(q.options) && q.options.length === 4 &&
      typeof q.bonne_reponse === 'number' && q.bonne_reponse >= 0 && q.bonne_reponse <= 3
    )
    if (valides.length === 0) return res.status(500).json({ error: 'L\'IA n\'a pas pu générer de questions valides' })

    res.json({ questions: valides })
  } catch (err) {
    console.error('Erreur génération IA:', err)
    res.status(500).json({ error: 'Erreur lors de la génération IA' })
  }
})

// ── POST /api/quiz — créer un quiz (manuel ou issu de l'IA) ──────
router.post('/', verifyToken, async (req, res) => {
  if (!['professeur', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Accès réservé aux professeurs et administrateurs' })
  }
  const { titre, matiere, niveau, questions, ai_genere } = req.body
  if (!titre || !matiere || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'titre, matiere et au moins une question sont requis' })
  }
  for (const q of questions) {
    if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || typeof q.bonne_reponse !== 'number') {
      return res.status(400).json({ error: 'Chaque question doit avoir un texte, 4 options et une bonne réponse' })
    }
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const quizRes = await client.query(
      `INSERT INTO quizzes (titre, matiere, niveau, created_by, ai_genere) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [titre, matiere, niveau || null, req.user.id, !!ai_genere]
    )
    const quiz = quizRes.rows[0]
    for (const q of questions) {
      await client.query(
        `INSERT INTO quiz_questions (quiz_id, question, options, bonne_reponse) VALUES ($1,$2,$3,$4)`,
        [quiz.id, q.question, JSON.stringify(q.options), q.bonne_reponse]
      )
    }
    await client.query('COMMIT')
    res.json({ quiz })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  } finally {
    client.release()
  }
})

// ── GET /api/quiz/:id — détail d'un quiz ─────────────────────────
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const quizRes = await pool.query(`SELECT * FROM quizzes WHERE id = $1`, [req.params.id])
    if (quizRes.rows.length === 0) return res.status(404).json({ error: 'Quiz non trouvé' })
    const quiz = quizRes.rows[0]

    const questionsRes = await pool.query(`SELECT * FROM quiz_questions WHERE quiz_id = $1 ORDER BY id`, [req.params.id])
    let questions = questionsRes.rows

    if (!['professeur', 'admin'].includes(req.user.role)) {
      const resultatRes = await pool.query(
        `SELECT * FROM quiz_resultats WHERE quiz_id = $1 AND etudiant_id = $2`,
        [req.params.id, req.user.id]
      )
      const dejaFait = resultatRes.rows[0]
      if (dejaFait) {
        return res.json({ quiz, questions, resultat: dejaFait })
      }
      questions = questions.map(q => ({ id: q.id, question: q.question, options: q.options }))
      return res.json({ quiz, questions, resultat: null })
    }

    res.json({ quiz, questions, resultat: null })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ── POST /api/quiz/:id/soumettre — soumission + correction auto ──
router.post('/:id/soumettre', verifyToken, async (req, res) => {
  const { reponses } = req.body
  try {
    const existing = await pool.query(
      `SELECT id FROM quiz_resultats WHERE quiz_id = $1 AND etudiant_id = $2`,
      [req.params.id, req.user.id]
    )
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Vous avez déjà passé ce quiz' })

    const questionsRes = await pool.query(`SELECT * FROM quiz_questions WHERE quiz_id = $1 ORDER BY id`, [req.params.id])
    const questions = questionsRes.rows
    if (questions.length === 0) return res.status(404).json({ error: 'Quiz introuvable' })

    let score = 0
    const corrections = questions.map(q => {
      const choisi = reponses?.[q.id] ?? null
      const correct = choisi === q.bonne_reponse
      if (correct) score++
      return { id: q.id, question: q.question, options: q.options, bonne_reponse: q.bonne_reponse, choisi, correct }
    })

    await pool.query(
      `INSERT INTO quiz_resultats (quiz_id, etudiant_id, score, total, reponses) VALUES ($1,$2,$3,$4,$5)`,
      [req.params.id, req.user.id, score, questions.length, JSON.stringify(reponses || {})]
    )

    res.json({ score, total: questions.length, corrections })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ── GET /api/quiz/:id/resultats — résultats des étudiants ────────
router.get('/:id/resultats', verifyToken, async (req, res) => {
  if (!['professeur', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Accès refusé' })
  }
  try {
    const quizRes = await pool.query(`SELECT * FROM quizzes WHERE id = $1`, [req.params.id])
    if (quizRes.rows.length === 0) return res.status(404).json({ error: 'Quiz non trouvé' })
    if (req.user.role !== 'admin' && quizRes.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    const result = await pool.query(
      `SELECT qr.score, qr.total, qr.created_at, u.username, u.prenom, u.nom, u.matricule
       FROM quiz_resultats qr JOIN users u ON u.id = qr.etudiant_id
       WHERE qr.quiz_id = $1 ORDER BY qr.score DESC`,
      [req.params.id]
    )
    res.json({ quiz: quizRes.rows[0], resultats: result.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ── DELETE /api/quiz/:id — supprimer un quiz ──────────────────────
router.delete('/:id', verifyToken, async (req, res) => {
  if (!['professeur', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Accès refusé' })
  }
  try {
    const quizRes = await pool.query(`SELECT created_by FROM quizzes WHERE id = $1`, [req.params.id])
    if (quizRes.rows.length === 0) return res.status(404).json({ error: 'Quiz non trouvé' })
    if (req.user.role !== 'admin' && quizRes.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé' })
    }
    await pool.query(`DELETE FROM quizzes WHERE id = $1`, [req.params.id])
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router