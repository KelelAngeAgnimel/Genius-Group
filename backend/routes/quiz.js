import express from 'express'
import { z } from 'zod'
import supabase from '../supabase.js'
import Groq from 'groq-sdk'
import multer from 'multer'
import { PDFParse } from 'pdf-parse'
import { verifyToken } from '../middleware/authMiddleware.js'
import { iaLimiter } from '../middleware/rateLimit.js'
import { validate } from '../middleware/validate.js'
import { peutAcceder, peutPublierPour, concoursContenuSchema, generationAutoAutorisee, LIBELLES } from '../lib/concours.js'
import { optionsConcours } from '../lib/inscriptions.js'

const court = (max) => z.string().trim().max(max)
const genererIaSchema = z.object({
  matiere: court(100).min(1),
  niveau: court(100).nullish(),
  theme: court(300).nullish(),
  nombre_questions: z.union([z.number(), z.string().max(5)]).nullish(),
  concours: concoursContenuSchema.nullish()
})
const creerQuizSchema = z.object({
  titre: court(200).min(1),
  matiere: court(100).min(1),
  niveau: court(100).nullish(),
  questions: z.array(z.object({
    question: court(2000).min(1),
    options: z.array(z.string().max(1000)).length(4),
    bonne_reponse: z.number().int().min(0).max(3)
  }).passthrough()).min(1).max(100),
  ai_genere: z.boolean().nullish(),
  duree_minutes: z.union([z.number(), z.string().max(6)]),
  concours: concoursContenuSchema.nullish(),
  modalite: court(30).nullish()
})
const soumettreSchema = z.object({
  reponses: z.union([z.array(z.any()).max(500), z.record(z.string(), z.any())])
}).passthrough()


// Matières officielles par concours
const MATIERES = {
  inphb: ['Culture Générale', 'Culture Scientifique', 'Culture Littéraire'],
  esatic: ['Mathématiques', 'Physique', 'Anglais', 'Français'],
  all: ['Culture Générale', 'Culture Scientifique', 'Culture Littéraire', 'Mathématiques', 'Physique', 'Anglais', 'Français']
}

function peutVoirQuiz(user, quizConcours, quizModalite) {
  if (user.role === 'admin' || user.role === 'professeur') return true
  if (!peutAcceder(user, quizConcours)) return false
  // Vérifier modalité
  if (quizModalite !== 'les_deux' && user.modalite && quizModalite !== user.modalite) return false
  return true
}

const router = express.Router()
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
      if (error) { console.error(error); return res.status(500).json({ error: 'Erreur serveur' }) }

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
      if (quizzesErr) { console.error(quizzesErr); return res.status(500).json({ error: 'Erreur serveur' }) }

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
        peutVoirQuiz(req.user, q.concours || 'all', q.modalite || 'les_deux')
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
router.post('/generer-ia', verifyToken, iaLimiter, validate(genererIaSchema), async (req, res) => {
  if (!['professeur', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Accès réservé aux professeurs et administrateurs' })
  }
  const { matiere, niveau, theme, nombre_questions, concours } = req.body
  if (!generationAutoAutorisee(await optionsConcours(), req.user, concours)) {
    return res.status(403).json({ error: 'La génération automatique de tests n’est pas disponible pour ce concours' })
  }
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
router.post('/importer-pdf', verifyToken, iaLimiter, (req, res, next) => {
  upload.single('fichier')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Le fichier PDF dépasse la taille maximale autorisée (10 Mo)' })
      }
      return res.status(400).json({ error: "Erreur lors de l'envoi du fichier" })
    }
    if (err) {
      return res.status(400).json({ error: 'Fichier invalide, seuls les PDF sont acceptés' })
    }
    next()
  })
}, async (req, res) => {
  if (!['professeur', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Accès réservé aux professeurs et administrateurs' })
  }
  if (!generationAutoAutorisee(await optionsConcours(), req.user, req.body?.concours)) {
    return res.status(403).json({ error: 'La génération automatique de tests n’est pas disponible pour ce concours' })
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
    const { text: texteBrut } = await parser.getText()

    if (!texteBrut || texteBrut.trim().length < 20) {
      return res.status(400).json({ error: "Le PDF semble vide ou le texte n'a pas pu être extrait (PDF scanné/image non supporté)" })
    }

    // Les PDF avec beaucoup de notation mathématique (fractions, sommes, racines...)
    // produisent souvent des caractères de contrôle invisibles lors de l'extraction
    // (ligatures/glyphes de police non standards mal mappés). On les retire pour
    // éviter de perturber l'IA, tout en gardant les retours à la ligne utiles.
    const text = texteBrut
      .split('').filter(c => {
        const code = c.charCodeAt(0)
        return code >= 32 || c === '\n' || c === '\r' || c === '\t'
      }).join('')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')

    const texteTronque = text.slice(0, 15000)

    let completion
    try {
      completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 8192,
        messages: [
          {
            role: 'system',
            content: 'Tu reçois le texte brut extrait d\'un PDF contenant un QCM (questions à choix multiples). Ce texte peut contenir de la notation mathématique désorganisée par l\'extraction (fractions, exposants, sommes ou racines éclatés sur plusieurs lignes, symboles mal reconnus) : reconstitue du mieux possible le sens mathématique de chaque question à partir du contexte. Identifie chaque question et ses options de réponse, puis détermine la bonne réponse si elle est indiquée dans le texte (par exemple par un astérisque, un "Réponse :", une grille de réponses en fin de document, un corrigé détaillé, etc.). Si la bonne réponse n\'est pas identifiable avec certitude, choisis l\'option la plus plausible. Tu réponds UNIQUEMENT avec un tableau JSON valide, sans aucun texte avant ou après, sans balises markdown. Format exact : [{"question": "texte", "options": ["a","b","c","d"], "bonne_reponse": 0}]. bonne_reponse est l\'index (0 à 3) de la bonne réponse dans options. Ignore les éléments qui ne sont pas des questions (en-têtes, numéros de page, instructions générales, noms d\'examen, corrigé détaillé). Chaque question doit avoir exactement 4 options : si le document en propose plus ou moins, adapte en conservant les plus pertinentes ou en complétant avec des options plausibles.'
          },
          {
            role: 'user',
            content: `Voici le texte extrait du PDF :\n\n${texteTronque}`
          }
        ]
      })
    } catch (groqErr) {
      console.error('Erreur appel Groq (import PDF):', groqErr?.message || groqErr)
      return res.status(502).json({ error: "Le service IA n'a pas pu traiter ce PDF (erreur de communication avec le modèle). Réessaie dans quelques instants." })
    }

    let raw = completion.choices[0].message.content.trim()
    raw = raw.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim()

    let questions
    let reponseTronquee = false
    try {
      questions = JSON.parse(raw)
    } catch {
      const dernierObjetComplet = raw.lastIndexOf('},')
      if (dernierObjetComplet === -1) {
        console.error('JSON IA invalide (import PDF), début de la réponse:', raw.slice(0, 300))
        return res.status(500).json({ error: "L'IA n'a pas pu structurer le contenu du PDF en QCM valide" })
      }
      try {
        questions = JSON.parse(raw.slice(0, dernierObjetComplet + 1) + ']')
        reponseTronquee = true
      } catch {
        console.error('JSON IA invalide même après troncature (import PDF), début de la réponse:', raw.slice(0, 300))
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
    console.error('Erreur import PDF:', err?.message || err, err?.stack)
    res.status(500).json({ error: "Erreur lors du traitement du PDF" })
  } finally {
    if (parser) await parser.destroy()
  }
})

// ── POST /api/quiz — créer un quiz (manuel ou issu de l'IA) ──────
router.post('/', verifyToken, validate(creerQuizSchema), async (req, res) => {
  if (!['professeur', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Accès réservé aux professeurs et administrateurs' })
  }
  const { titre, matiere, niveau, questions, ai_genere, duree_minutes, concours, modalite } = req.body
  if (!titre || !matiere || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'titre, matiere et au moins une question sont requis' })
  }
  if (ai_genere && !generationAutoAutorisee(await optionsConcours(), req.user, concours)) {
    return res.status(403).json({ error: 'La génération automatique de tests n’est pas disponible pour ce concours' })
  }
  if (!peutPublierPour(req.user, concours || 'all')) {
    return res.status(403).json({ error: 'Vous ne pouvez publier que pour vos concours' })
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

    if (quizErr) { console.error(quizErr); return res.status(500).json({ error: 'Erreur serveur' }) }

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
      { console.error(questionsErr); return res.status(500).json({ error: 'Erreur serveur' }) }
    }

    res.json({ quiz })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ── PATCH /api/quiz/:id/visibilite — masquer / afficher un quiz ──
router.patch('/:id/visibilite', verifyToken, async (req, res) => {
  if (!['professeur', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Accès refusé' })
  }
  try {
    const { data: quiz, error: quizErr } = await supabase
      .from('quizzes')
      .select('id, created_by, publie')
      .eq('id', req.params.id)
      .single()

    if (quizErr || !quiz) return res.status(404).json({ error: 'Quiz non trouvé' })
    if (req.user.role !== 'admin' && quiz.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    // Si publie est fourni on l'applique, sinon on bascule l'état actuel
    const nouveauPublie = typeof req.body.publie === 'boolean' ? req.body.publie : !quiz.publie

    const { data, error } = await supabase
      .from('quizzes')
      .update({ publie: nouveauPublie })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) { console.error(error); return res.status(500).json({ error: 'Erreur serveur' }) }
    res.json({ quiz: data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ── PATCH /api/quiz/:id — renommer un quiz ───────────────────────
router.patch('/:id', verifyToken, async (req, res) => {
  if (!['professeur', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Accès refusé' })
  }
  try {
    const { data: quiz, error: quizErr } = await supabase
      .from('quizzes')
      .select('id, created_by')
      .eq('id', req.params.id)
      .single()

    if (quizErr || !quiz) return res.status(404).json({ error: 'Quiz non trouvé' })
    if (req.user.role !== 'admin' && quiz.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    const updates = {}
    if (typeof req.body.titre === 'string' && req.body.titre.trim()) {
      updates.titre = req.body.titre.trim()
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Aucune modification fournie' })
    }

    const { data, error } = await supabase
      .from('quizzes')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) { console.error(error); return res.status(500).json({ error: 'Erreur serveur' }) }
    res.json({ quiz: data })
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

    if (qErr) { console.error(qErr); return res.status(500).json({ error: 'Erreur serveur' }) }
    let questions = questionsData

    if (!['professeur', 'admin'].includes(req.user.role)) {
      // Un quiz masqué (non publié) n'est pas accessible aux élèves,
      // même par lien direct.
      if (!quiz.publie) {
        return res.status(403).json({ error: 'Ce quiz n\'est pas disponible pour le moment' })
      }

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
router.post('/:id/soumettre', verifyToken, validate(soumettreSchema), async (req, res) => {
  const { reponses } = req.body
  try {
    const { data: tentativesPrecedentes, error: tentErr } = await supabase
      .from('quiz_resultats')
      .select('tentative_numero')
      .eq('quiz_id', req.params.id)
      .eq('etudiant_id', req.user.id)
      .order('tentative_numero', { ascending: false })
      .limit(1)

    if (tentErr) { console.error(tentErr); return res.status(500).json({ error: 'Erreur serveur' }) }
    const estPremiEreTentative = !tentativesPrecedentes || tentativesPrecedentes.length === 0
    const prochainNumero = estPremiEreTentative ? 1 : tentativesPrecedentes[0].tentative_numero + 1

    const { data: questions, error: qErr } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', req.params.id)
      .order('id')

    if (qErr) { console.error(qErr); return res.status(500).json({ error: 'Erreur serveur' }) }
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
      if (insertErr) { console.error(insertErr); return res.status(500).json({ error: 'Erreur serveur' }) }
      created_at = nouvelleTentative.created_at

      // Répercuter automatiquement la note dans "Mes notes" de l'étudiant.
      // On récupère le quiz pour connaître la matière et le concours indiqués
      // à sa création : c'est cette matière/concours qui reçoit la note.
      try {
        const { data: quizInfo } = await supabase
          .from('quizzes')
          .select('titre, matiere, concours, created_by')
          .eq('id', req.params.id)
          .single()

        if (quizInfo) {
          const noteSur20 = Math.round((score / questions.length) * 20 * 100) / 100
          // La table "notes" utilise des libellés différents de la table "quizzes"
          // pour le concours : on fait correspondre les deux conventions.
          const concoursNote = LIBELLES[quizInfo.concours] || 'tous'
          // Une "periode" propre au quiz évite d'écraser une note saisie
          // manuellement par le professeur pour la même matière/concours.
          const periodeNote = `Genius Eval — ${quizInfo.titre}`

          const { data: noteExistante } = await supabase
            .from('notes')
            .select('id')
            .eq('etudiant_id', req.user.id)
            .eq('matiere', quizInfo.matiere)
            .eq('concours', concoursNote)
            .eq('periode', periodeNote)
            .single()

          if (noteExistante) {
            await supabase
              .from('notes')
              .update({ note: noteSur20, professeur_id: quizInfo.created_by })
              .eq('id', noteExistante.id)
          } else {
            await supabase
              .from('notes')
              .insert([{
                etudiant_id: req.user.id,
                matiere: quizInfo.matiere,
                concours: concoursNote,
                note: noteSur20,
                periode: periodeNote,
                professeur_id: quizInfo.created_by
              }])
          }
        }
      } catch (noteErr) {
        // On ne bloque jamais la remise du résultat à l'étudiant si la
        // synchronisation vers "Mes notes" échoue.
        console.error('Erreur synchronisation Genius Eval -> Mes notes:', noteErr)
      }
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
    // Pour les RÉSULTATS, un professeur voit la même chose qu'un admin
    // (la restriction « ses propres quiz » ne s'applique qu'au contenu/à la gestion).

    const { data: resultats, error: resErr } = await supabase
      .from('quiz_resultats')
      .select('score, total, created_at, tentative_numero, etudiant_id, etudiant:etudiant_id(username, prenom, nom, matricule)')
      .eq('quiz_id', req.params.id)
      .order('etudiant_id')
      .order('tentative_numero', { ascending: true })

    if (resErr) { console.error(resErr); return res.status(500).json({ error: 'Erreur serveur' }) }

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
    if (delErr) { console.error(delErr); return res.status(500).json({ error: 'Erreur serveur' }) }
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router