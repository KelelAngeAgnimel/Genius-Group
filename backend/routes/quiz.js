import express from 'express'
import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'
import multer from 'multer'
import { PDFParse } from 'pdf-parse'
import { verifyToken } from './auth.js'
import dotenv from 'dotenv'

dotenv.config()


// Matières officielles par concours
const MATIERES = {
  inphb: ['Culture Générale', 'Culture Scientifique', 'Culture Littéraire'],
  esatic: ['Mathématiques', 'Physique', 'Anglais', 'Français'],
  all: ['Culture Générale', 'Culture Scientifique', 'Culture Littéraire', 'Mathématiques', 'Physique', 'Anglais', 'Français']
}

// Rôles autorisés par concours
const ROLES_INPHB = ['etudiant_inphb', 'etudiant_both', 'etudiant_inphb_cme', 'etudiant_all']
const ROLES_ESATIC = ['etudiant_esatic', 'etudiant_both', 'etudiant_esatic_cme', 'etudiant_all']

function peutVoirQuiz(role, modalite, quizConcours, quizModalite) {
  if (role === 'admin' || role === 'professeur') return true
  // Vérifier concours
  if (quizConcours === 'inphb' && !ROLES_INPHB.includes(role)) return false
  if (quizConcours === 'esatic' && !ROLES_ESATIC.includes(role)) return false
  // Vérifier modalité
  if (quizModalite !== 'les_deux' && modalite && quizModalite !== modalite) return false
  return true
}

const router = express.Router()
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
// On instancie Groq seulement si la clé existe, pour ne jamais faire planter le serveur au démarrage
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null

// Upload PDF en mémoire (pas de disque, adapté à Render dont le disque est éphémère)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo max
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Seuls les fichiers PDF sont acceptés'))
    }
    cb(null, true)
  }
})

// ── GET /api/quiz — liste des quiz (adaptée au rôle) ─────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    if (['professeur', 'admin'].includes(req.user.role)) {
      let query = supabase.from('quizzes').select('*').order('created_at', { ascending: false })
      if (req.user.role !== 'admin') {
        query = query.eq('created_by', req.user.id)
      }
      const { data: quizzes, error } = await query
      if (error) return res.status(500).json({ error: error.message })

      const quizIds = quizzes.map(q => q.id)

      const { data: questions } = quizIds.length
        ? await supabase.from('quiz_questions').select('id, quiz_id').in('quiz_id', quizIds)
        : { data: [] }

      const { data: resultats } = quizIds.length
        ? await supabase.from('quiz_resultats').select('quiz_id, score, total').in('quiz_id', quizIds)
        : { data: [] }

      const enriched = quizzes.map(q => {
        const nb_questions = (questions || []).filter(qu => qu.quiz_id === q.id).length
        const tentatives = (resultats || []).filter(r => r.quiz_id === q.id)
        const nb_tentatives = tentatives.length
        const moyenne_pct = nb_tentatives > 0
          ? Math.round((tentatives.reduce((acc, r) => acc + (r.score / r.total) * 100, 0) / nb_tentatives) * 10) / 10
          : null
        return { ...q, nb_questions, nb_tentatives, moyenne_pct }
      })

      res.json({ quizzes: enriched })
    } else {
      const { data: quizzesData, error: quizzesErr } = await supabase
        .from('quizzes')
        .select('*')
        .eq('publie', true)
        .order('created_at', { ascending: false })
      if (quizzesErr) return res.status(500).json({ error: quizzesErr.message })

      const quizIds = quizzesData.map(q => q.id)

      const { data: questions } = quizIds.length
        ? await supabase.from('quiz_questions').select('id, quiz_id').in('quiz_id', quizIds)
        : { data: [] }

      const { data: resultatsRes } = await supabase
        .from('quiz_resultats')
        .select('quiz_id, score, total')
        .eq('etudiant_id', req.user.id)

      // Pour chaque quiz : nombre de tentatives déjà faites et meilleur score obtenu
      const statsParQuiz = {}
      ;(resultatsRes || []).forEach(r => {
        if (!statsParQuiz[r.quiz_id]) {
          statsParQuiz[r.quiz_id] = { nb_tentatives: 0, meilleur_score: 0, meilleur_total: r.total }
        }
        statsParQuiz[r.quiz_id].nb_tentatives++
        if (r.score > statsParQuiz[r.quiz_id].meilleur_score) {
          statsParQuiz[r.quiz_id].meilleur_score = r.score
          statsParQuiz[r.quiz_id].meilleur_total = r.total
        }
      })

      // Filtrer les quiz selon le concours et la modalité de l'étudiant
      const quizzesFiltres = quizzesData.filter(q =>
        peutVoirQuiz(req.user.role, req.user.modalite, q.concours || 'all', q.modalite || 'les_deux')
      )
      const quizzes = quizzesFiltres.map(q => ({
        ...q,
        nb_questions: (questions || []).filter(qu => qu.quiz_id === q.id).length,
        deja_fait: !!statsParQuiz[q.id],
        nb_tentatives: statsParQuiz[q.id]?.nb_tentatives ?? 0,
        score: statsParQuiz[q.id]?.meilleur_score ?? null,
        total_score: statsParQuiz[q.id]?.meilleur_total ?? null
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

  if (!groq) {
    return res.status(503).json({ error: 'Le service IA est momentanément indisponible (clé API manquante côté serveur)' })
  }

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

// ── POST /api/quiz/importer-pdf — extraction de QCM depuis un PDF ─
router.post('/importer-pdf', verifyToken, (req, res, next) => {
  upload.single('fichier')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Le fichier PDF dépasse la taille maximale autorisée (10 Mo)' })
      }
      return res.status(400).json({ error: `Erreur d'upload : ${err.message}` })
    }
    if (err) {
      return res.status(400).json({ error: err.message || 'Fichier invalide, seuls les PDF sont acceptés' })
    }
    next()
  })
}, async (req, res) => {
  if (!['professeur', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Accès réservé aux professeurs et administrateurs' })
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier PDF reçu' })
  }
  if (!groq) {
    return res.status(503).json({ error: 'Le service IA est momentanément indisponible (clé API manquante côté serveur)' })
  }

  let parser
  try {
    parser = new PDFParse({ data: req.file.buffer })
    const { text } = await parser.getText()

    if (!text || text.trim().length < 20) {
      return res.status(400).json({ error: "Le PDF semble vide ou le texte n'a pas pu être extrait (PDF scanné/image non supporté)" })
    }

    const texteTronque = text.slice(0, 15000)

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 8192,
      messages: [
        {
          role: 'system',
          content: 'Tu reçois le texte brut extrait d\'un PDF contenant un QCM (questions à choix multiples). Identifie chaque question et ses options de réponse, puis détermine la bonne réponse si elle est indiquée dans le texte (par exemple par un astérisque, un "Réponse :", un soulignement signalé, une mise en gras perdue à l\'extraction, etc.). Si la bonne réponse n\'est pas identifiable avec certitude, choisis l\'option la plus plausible. Tu réponds UNIQUEMENT avec un tableau JSON valide, sans aucun texte avant ou après, sans balises markdown. Format exact : [{"question": "texte", "options": ["a","b","c","d"], "bonne_reponse": 0}]. bonne_reponse est l\'index (0 à 3) de la bonne réponse dans options. Ignore les éléments qui ne sont pas des questions (en-têtes, numéros de page, instructions générales, noms d\'examen). Chaque question doit avoir exactement 4 options : si le document en propose plus ou moins, adapte en conservant les plus pertinentes ou en complétant avec des options plausibles.'
        },
        {
          role: 'user',
          content: `Voici le texte extrait du PDF :\n\n${texteTronque}`
        }
      ]
    })

    let raw = completion.choices[0].message.content.trim()
    raw = raw.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim()

    let questions
    let reponseTronquee = false
    try {
      questions = JSON.parse(raw)
    } catch {
      const dernierObjetComplet = raw.lastIndexOf('},')
      if (dernierObjetComplet === -1) {
        return res.status(500).json({ error: "L'IA n'a pas pu structurer le contenu du PDF en QCM valide" })
      }
      try {
        questions = JSON.parse(raw.slice(0, dernierObjetComplet + 1) + ']')
        reponseTronquee = true
      } catch {
        return res.status(500).json({ error: "L'IA n'a pas pu structurer le contenu du PDF en QCM valide" })
      }
    }

    const valides = questions.filter(q =>
      q.question && Array.isArray(q.options) && q.options.length === 4 &&
      typeof q.bonne_reponse === 'number' && q.bonne_reponse >= 0 && q.bonne_reponse <= 3
    )

    if (valides.length === 0) {
      return res.status(422).json({ error: "Aucune question de type QCM n'a pu être identifiée dans ce PDF" })
    }

    res.json({
      questions: valides,
      nb_detectees: questions.length,
      nb_valides: valides.length,
      tronque: reponseTronquee
    })
  } catch (err) {
    console.error('Erreur import PDF:', err)
    res.status(500).json({ error: "Erreur lors du traitement du PDF" })
  } finally {
    if (parser) await parser.destroy()
  }
})

// ── POST /api/quiz — créer un quiz (manuel ou issu de l'IA) ──────
router.post('/', verifyToken, async (req, res) => {
  if (!['professeur', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Accès réservé aux professeurs et administrateurs' })
  }
  const { titre, matiere, niveau, questions, ai_genere, duree_minutes, concours, modalite } = req.body
  if (!titre || !matiere || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'titre, matiere et au moins une question sont requis' })
  }
  const duree = parseInt(duree_minutes)
  if (!duree || duree < 1) {
    return res.status(400).json({ error: 'La durée du quiz (en minutes) est requise et doit être supérieure à 0' })
  }
  for (const q of questions) {
    if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || typeof q.bonne_reponse !== 'number') {
      return res.status(400).json({ error: 'Chaque question doit avoir un texte, 4 options et une bonne réponse' })
    }
  }

  try {
    const { data: quiz, error: quizErr } = await supabase
      .from('quizzes')
      .insert([{
        titre,
        matiere,
        niveau: niveau || null,
        created_by: req.user.id,
        ai_genere: !!ai_genere,
        duree_minutes: duree,
        concours: concours || 'all',
        modalite: modalite || 'les_deux' 
      }])
      .select()
      .single()

    if (quizErr) return res.status(500).json({ error: quizErr.message })

    const questionsToInsert = questions.map(q => ({
      quiz_id: quiz.id,
      question: q.question,
      options: q.options,
      bonne_reponse: q.bonne_reponse
    }))

    const { error: questionsErr } = await supabase
      .from('quiz_questions')
      .insert(questionsToInsert)

    if (questionsErr) {
      await supabase.from('quizzes').delete().eq('id', quiz.id)
      return res.status(500).json({ error: questionsErr.message })
    }

    res.json({ quiz })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ── GET /api/quiz/:id — détail d'un quiz ─────────────────────────
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { data: quiz, error: quizErr } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (quizErr || !quiz) return res.status(404).json({ error: 'Quiz non trouvé' })

    const { data: questionsData, error: qErr } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', req.params.id)
      .order('id')

    if (qErr) return res.status(500).json({ error: qErr.message })
    let questions = questionsData

    if (!['professeur', 'admin'].includes(req.user.role)) {
      const { data: tentatives } = await supabase
        .from('quiz_resultats')
        .select('*')
        .eq('quiz_id', req.params.id)
        .eq('etudiant_id', req.user.id)
        .order('tentative_numero', { ascending: true })

      const questionsSansReponse = questions.map(q => ({ id: q.id, question: q.question, options: q.options }))

      return res.json({
        quiz,
        questions: questionsSansReponse,
        tentatives: tentatives || []
      })
    }

    res.json({ quiz, questions, tentatives: [] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ── POST /api/quiz/:id/soumettre — soumission + correction auto ──
router.post('/:id/soumettre', verifyToken, async (req, res) => {
  const { reponses } = req.body
  try {
    const { data: tentativesPrecedentes, error: tentErr } = await supabase
      .from('quiz_resultats')
      .select('tentative_numero')
      .eq('quiz_id', req.params.id)
      .eq('etudiant_id', req.user.id)
      .order('tentative_numero', { ascending: false })
      .limit(1)

    if (tentErr) return res.status(500).json({ error: tentErr.message })
    const estPremiEreTentative = !tentativesPrecedentes || tentativesPrecedentes.length === 0
    const prochainNumero = estPremiEreTentative ? 1 : tentativesPrecedentes[0].tentative_numero + 1

    const { data: questions, error: qErr } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', req.params.id)
      .order('id')

    if (qErr) return res.status(500).json({ error: qErr.message })
    if (!questions || questions.length === 0) return res.status(404).json({ error: 'Quiz introuvable' })

    let score = 0
    const corrections = questions.map(q => {
      const choisi = reponses?.[q.id] ?? null
      const correct = choisi !== null && choisi === q.bonne_reponse
      if (correct) score++
      return { id: q.id, question: q.question, options: q.options, bonne_reponse: q.bonne_reponse, choisi, correct }
    })

    // Sauvegarder en base UNIQUEMENT si c'est la première tentative
    // Les tentatives suivantes sont corrigées mais la note n'est pas conservée
    let created_at = new Date().toISOString()
    if (estPremiEreTentative) {
      const { data: nouvelleTentative, error: insertErr } = await supabase
        .from('quiz_resultats')
        .insert([{
          quiz_id: req.params.id,
          etudiant_id: req.user.id,
          score,
          total: questions.length,
          reponses: reponses || {},
          tentative_numero: 1
        }])
        .select()
        .single()
      if (insertErr) return res.status(500).json({ error: insertErr.message })
      created_at = nouvelleTentative.created_at
    }

    res.json({
      score,
      total: questions.length,
      corrections,
      tentative_numero: prochainNumero,
      note_conservee: estPremiEreTentative,
      created_at
    })
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
    const { data: quiz, error: quizErr } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (quizErr || !quiz) return res.status(404).json({ error: 'Quiz non trouvé' })
    if (req.user.role !== 'admin' && quiz.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    const { data: resultats, error: resErr } = await supabase
      .from('quiz_resultats')
      .select('score, total, created_at, tentative_numero, etudiant_id, etudiant:etudiant_id(username, prenom, nom, matricule)')
      .eq('quiz_id', req.params.id)
      .order('etudiant_id')
      .order('tentative_numero', { ascending: true })

    if (resErr) return res.status(500).json({ error: resErr.message })

    const parEtudiant = {}
    for (const r of (resultats || [])) {
      if (!parEtudiant[r.etudiant_id]) {
        parEtudiant[r.etudiant_id] = {
          etudiant_id: r.etudiant_id,
          username: r.etudiant?.username,
          prenom: r.etudiant?.prenom,
          nom: r.etudiant?.nom,
          matricule: r.etudiant?.matricule,
          tentatives: [],
          meilleur_score: 0,
          meilleur_total: r.total
        }
      }
      parEtudiant[r.etudiant_id].tentatives.push({
        tentative_numero: r.tentative_numero,
        score: r.score,
        total: r.total,
        created_at: r.created_at
      })
      if (r.score > parEtudiant[r.etudiant_id].meilleur_score) {
        parEtudiant[r.etudiant_id].meilleur_score = r.score
        parEtudiant[r.etudiant_id].meilleur_total = r.total
      }
    }

    const resultatsParEtudiant = Object.values(parEtudiant).sort((a, b) => (b.meilleur_score / b.meilleur_total) - (a.meilleur_score / a.meilleur_total))

    res.json({ quiz, resultats: resultatsParEtudiant })
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
    const { data: quiz, error: quizErr } = await supabase
      .from('quizzes')
      .select('created_by')
      .eq('id', req.params.id)
      .single()

    if (quizErr || !quiz) return res.status(404).json({ error: 'Quiz non trouvé' })
    if (req.user.role !== 'admin' && quiz.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    const { error: delErr } = await supabase.from('quizzes').delete().eq('id', req.params.id)
    if (delErr) return res.status(500).json({ error: delErr.message })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router