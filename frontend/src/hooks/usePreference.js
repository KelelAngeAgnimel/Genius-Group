import { useState } from 'react'

// Préférence mémorisée dans localStorage (accès protégé : navigation privée, stockage désactivé…)
export function usePreference(cle, defaut, valeursPermises) {
  const [valeur, setValeur] = useState(() => {
    try {
      const v = window.localStorage.getItem(cle)
      return v !== null && (!valeursPermises || valeursPermises.includes(v)) ? v : defaut
    } catch { return defaut }
  })
  const definir = (v) => {
    setValeur(v)
    try { window.localStorage.setItem(cle, v) } catch { /* stockage indisponible : la préférence vaut pour cette visite */ }
  }
  return [valeur, definir]
}
