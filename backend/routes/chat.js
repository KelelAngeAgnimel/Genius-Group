import express from 'express'
import Groq from 'groq-sdk'
import { z } from 'zod'
import { verifyToken } from '../middleware/authMiddleware.js'
import { iaLimiter } from '../middleware/rateLimit.js'
import { validate } from '../middleware/validate.js'

const router = express.Router()
// On instancie Groq seulement si la clé existe, pour ne jamais faire planter le serveur au démarrage
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null

const MAX_MESSAGES = 20            // historique conservé par utilisateur
const TTL_MS = 60 * 60 * 1000      // une conversation inactive 1 h est oubliée

// Historique en mémoire, clé = id de l'utilisateur authentifié (jamais fourni par le client)
const conversations = new Map() // userId -> { messages, derniere }

setInterval(() => {
  const limite = Date.now() - TTL_MS
  for (const [id, c] of conversations) if (c.derniere < limite) conversations.delete(id)
}, 10 * 60 * 1000).unref()

const chatSchema = z.object({
  message: z.string().trim().min(1).max(2000)
})

router.post('/', verifyToken, iaLimiter, validate(chatSchema), async (req, res) => {
  if (!groq) {
    return res.status(503).json({ error: 'Le service IA est momentanément indisponible' })
  }

  const cle = String(req.user.id)
  const conv = conversations.get(cle) || { messages: [], derniere: 0 }
  const historique = [...conv.messages, { role: 'user', content: req.body.message }].slice(-MAX_MESSAGES)

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: historique,
      max_tokens: 1024
    })

    const reply = response.choices[0].message.content

    // On ne mémorise l'échange qu'en cas de succès
    conversations.set(cle, {
      messages: [...historique, { role: 'assistant', content: reply }].slice(-MAX_MESSAGES),
      derniere: Date.now()
    })

    res.json({ reply })
  } catch (error) {
    console.error('Erreur Groq:', error)
    res.status(500).json({ error: 'Erreur lors de la communication avec Groq' })
  }
})

export default router
