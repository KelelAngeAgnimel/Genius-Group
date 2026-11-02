import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.js'
import usersRoutes from './routes/users.js'
import ressourcesRoutes from './routes/ressources.js'
import messagesRoutes from './routes/messages.js'
import notesRoutes from './routes/notes.js'
import chatRoutes from './routes/chat.js'
import exercicesRoutes from './routes/exercices.js'
import meetingsRoutes from './routes/meetings.js'
import quizRoutes from './routes/quiz.js'     
import planningRoutes from './routes/planning.js'
import concoursRoutes from './routes/concours.js'
import evaluationsRoutes from './routes/evaluations.js'
import competencesRoutes from './routes/competences.js'
import seancesRoutes from './routes/seances.js'
import autoEvalRoutes from './routes/auto-eval.js'
import tableauxRoutes from './routes/tableaux.js'
import renforcementRoutes from './routes/renforcement.js'

const app = express()

// ✅ CORS élargi pour éviter les blocages en prod
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://genius-group.vercel.app'
  ],
  credentials: true
}))

// Render place le serveur derrière un proxy : nécessaire pour que req.ip soit l'IP réelle (rate limit)
app.set('trust proxy', 1)
// CORP cross-origin : le frontend (Vercel) affiche des fichiers servis par cette API
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(express.json({ limit: '1mb' }))

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
app.use('/api/planning', planningRoutes)
app.use('/api/concours', concoursRoutes)
app.use('/api/evaluations', evaluationsRoutes)
app.use('/api/competences', competencesRoutes)
app.use('/api/seances', seancesRoutes)
app.use('/api/auto-eval', autoEvalRoutes)
app.use('/api/tableaux', tableauxRoutes)
app.use('/api/renforcement', renforcementRoutes)

app.get('/', (req, res) => res.send('API Portail Bacheliers 🚀'))

// Doivent rester en dernier
app.use(notFound)
app.use(errorHandler)

export default app
