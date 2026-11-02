import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import UiProvider from './components/UiProvider.jsx'

// Après un déploiement, les fichiers de pages changent de nom : un onglet resté ouvert ne retrouve plus
// la page demandée. On recharge alors une fois pour récupérer la nouvelle version.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  if (!sessionStorage.getItem('rechargement_chunk')) {
    sessionStorage.setItem('rechargement_chunk', '1')
    window.location.reload()
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <UiProvider>
        <App />
      </UiProvider>
    </AuthProvider>
  </StrictMode>
)