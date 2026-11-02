import { useContext } from 'react'
import { UiContext } from '../context/ui'

function useUiContext() {
  const ui = useContext(UiContext)
  if (!ui) throw new Error('UiProvider manquant : à placer dans main.jsx')
  return ui
}

// toast.succes('Enregistré') · toast.erreur('Impossible de …') · toast.info('…')
export const useToast = () => useUiContext().toast

// const confirmer = useConfirm()
// if (!(await confirmer({ titre: 'Supprimer ?', message: '…', confirmer: 'Supprimer', danger: true }))) return
export const useConfirm = () => useUiContext().confirmer
