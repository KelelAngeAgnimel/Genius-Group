import express from 'express'
import Groq from 'groq-sdk'

const router = express.Router()
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// Historique par session (en mémoire)
const conversations = {}

router.post('/', async (req, res) => {
  const { message, sessionId } = req.body

  if (!message || !sessionId) {
    return res.status(400).json({ error: 'message et sessionId sont requis' })
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
      model: 'llama3-8b-8192',
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