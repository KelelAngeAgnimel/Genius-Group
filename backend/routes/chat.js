import express from 'express'
import Groq from 'groq-sdk'

const router = express.Router()
// On instancie Groq seulement si la clé existe, pour ne jamais faire planter le serveur au démarrage
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null

// Historique par session (en mémoire)
const conversations = {}

router.post('/', async (req, res) => {
  const { message, sessionId } = req.body

  if (!message || !sessionId) {
    return res.status(400).json({ error: 'message et sessionId sont requis' })
  }

  if (!groq) {
    return res.status(503).json({ error: 'Le service IA est momentanément indisponible (clé API manquante côté serveur)' })
  }

  if (!conversations[sessionId]) {
    conversations[sessionId] = []
  }

  conversations[sessionId].push({
    role: 'user',
    content: message
  })

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: conversations[sessionId],
      max_tokens: 1024
    })

    const reply = response.choices[0].message.content

    conversations[sessionId].push({
      role: 'assistant',
      content: reply
    })

    res.json({ reply })
  } catch (error) {
    console.error('Erreur Groq:', error)
    res.status(500).json({ error: 'Erreur lors de la communication avec Groq' })
  }
})

export default router