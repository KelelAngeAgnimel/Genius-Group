import axios from 'axios'
import API_URL from './config'

// Client HTTP unique : ajoute le token et déconnecte l'utilisateur sur une réponse 401.
// validateStatus: les erreurs HTTP (4xx/5xx) ne lèvent pas d'exception, comme fetch :
// les pages lisent `res.ok` / `res.status` / `res.data` (message d'erreur du serveur).
// Seules les erreurs réseau passent dans le `catch`.
const api = axios.create({ baseURL: API_URL, validateStatus: () => true })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use((response) => {
  response.ok = response.status >= 200 && response.status < 300

  const url = response.config?.url ?? ''
  // Sur /auth/login, un 401 veut dire « identifiants incorrects » : pas de déconnexion
  if (response.status === 401 && !url.includes('/api/auth/login')) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    if (window.location.pathname !== '/') window.location.assign('/')
  }
  return response
})

export default api
