import { useCallback, useMemo, useRef, useState } from 'react'
import { UiContext } from '../context/ui'
import Toasts from './Toast'
import ConfirmDialog from './ConfirmDialog'

const DUREE_MS = { succes: 4000, info: 5000, erreur: 8000 }

export default function UiProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [dialogue, setDialogue] = useState(null) // { options, resoudre }
  const compteur = useRef(0)

  const fermer = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), [])
  const afficher = useCallback((type, message) => {
    const id = ++compteur.current
    setToasts(prev => [...prev.slice(-3), { id, type, message }]) // 4 messages au plus
    setTimeout(() => fermer(id), DUREE_MS[type])
  }, [fermer])

  const confirmer = useCallback((options) => new Promise(resoudre => setDialogue({ options, resoudre })), [])
  const repondre = (valeur) => { dialogue.resoudre(valeur); setDialogue(null) }

  const valeur = useMemo(() => ({
    toast: {
      succes: (m) => afficher('succes', m),
      erreur: (m) => afficher('erreur', m),
      info: (m) => afficher('info', m)
    },
    confirmer
  }), [afficher, confirmer])

  return (
    <UiContext.Provider value={valeur}>
      {children}
      <Toasts toasts={toasts} onFermer={fermer} />
      {dialogue && <ConfirmDialog {...dialogue.options} onReponse={repondre} />}
    </UiContext.Provider>
  )
}
