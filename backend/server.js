import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import usersRoutes from './routes/users.js'
import ressourcesRoutes from './routes/ressources.js'
import messagesRoutes from './routes/messages.js'
import notesRoutes from './routes/notes.js'
import chatRoutes from './routes/chat.js'
import exercicesRoutes from './routes/exercices.js'
import meetingsRoutes from './routes/meetings.js'
import quizRoutes from './routes/quiz.js'     

dotenv.config()
const app = express()

// ✅ CORS élargi pour éviter les blocages en prod
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://genius-group.vercel.app'
  ],
  credentials: true
}))

app.use(express.json())

// ✅ Route de health check — Render ping cette route pour vérifier que le serveur est vivant
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }))

app.use('/api/auth', authRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/ressources', ressourcesRoutes)
app.use('/api/messages', messagesRoutes)
app.use('/api/notes', notesRoutes)
app.use('/api/chat', chatRoutes)   
app.use('/api/exercices', exercicesRoutes)
app.use('/api/meetings', meetingsRoutes)  
app.use('/api/quiz', quizRoutes)

app.get('/', (req, res) => res.send('API Portail Bacheliers 🚀'))

// ✅ Écoute sur 0.0.0.0 obligatoire sur Render (pas seulement localhost)
const PORT = process.env.PORT || 3001
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur lancé sur le port ${PORT}`)
})