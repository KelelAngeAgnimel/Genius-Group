import dotenv from 'dotenv'

dotenv.config()
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET manquant : arrêt du serveur.')
  process.exit(1)
}

// Import après dotenv : les routes lisent process.env au chargement
const { default: app } = await import('./app.js')

// ✅ Écoute sur 0.0.0.0 obligatoire sur Render (pas seulement localhost)
const PORT = process.env.PORT || 3001
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur lancé sur le port ${PORT}`)
})