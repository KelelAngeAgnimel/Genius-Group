import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import usersRoutes from './routes/users.js'
import ressourcesRoutes from './routes/ressources.js'
import messagesRoutes from './routes/messages.js'

dotenv.config()
const app = express()

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://genius-group.vercel.app'
  ]
}))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/ressources', ressourcesRoutes)
app.use('/api/messages', messagesRoutes)

app.get('/', (req, res) => res.send('API Portail Bacheliers 🚀'))

app.listen(process.env.PORT || 3001, () => {
  console.log(`Serveur lancé sur http://localhost:${process.env.PORT || 3001}`)
})