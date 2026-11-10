import { useState, useEffect, useRef } from 'react'
import api from '../api'
import { useToast } from '../hooks/useUi'
import { libelleContenu } from '../lib/concours'

// ══════════════════════════════════════════
// LECTEUR PDF INTÉGRÉ
// ══════════════════════════════════════════
// Chargement unique de PDF.js depuis le CDN (aucune dépendance npm)
const PDFJS_VERSION = '3.11.174'
let pdfjsPromise = null
function chargerPdfJs() {
  if (typeof window !== 'undefined' && window.pdfjsLib) return Promise.resolve(window.pdfjsLib)
  if (pdfjsPromise) return pdfjsPromise
  pdfjsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`
    script.onload = () => {
      const lib = window.pdfjsLib
      if (!lib) { reject(new Error('pdf.js indisponible')); return }
      lib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`
      resolve(lib)
    }
    script.onerror = () => { pdfjsPromise = null; reject(new Error('Impossible de charger le lecteur PDF')) }
    document.body.appendChild(script)
  })
  return pdfjsPromise
}

// `nature` : « document » (Bibliothèque) ou « évaluation » (page Évaluations) — libellés et icône
export default function LecteurPDF({ ressource, onFermer, nature = 'document' }) {
  const evaluation = nature === 'évaluation'
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const containerRef = useRef(null)

  useEffect(() => {
    let annule = false
    afficherPDF(() => annule)
    return () => { annule = true }
  }, [])

  // Récupère les octets du PDF (protégés par le token) sous forme d'ArrayBuffer
  const recupererBuffer = async () => {
    const res = await api.get(`/api/ressources/ouvrir/${ressource.id}`, { responseType: 'arraybuffer' })
    if (!res.ok) {
      // Le corps d'erreur arrive aussi en binaire : on le décode pour lire le message
      let err = {}
      try { err = JSON.parse(new TextDecoder().decode(res.data)) } catch { /* corps non JSON */ }
      throw new Error(err.message || 'Impossible de charger le document')
    }
    return res.data
  }

  // Rend chaque page dans un <canvas> — fonctionne sur PC ET mobile
  const afficherPDF = async (estAnnule = () => false) => {
    try {
      setLoading(true)
      setErreur('')
      const [pdfjsLib, buffer] = await Promise.all([chargerPdfJs(), recupererBuffer()])
      if (estAnnule()) return

      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
      const container = containerRef.current
      if (!container || estAnnule()) return
      container.innerHTML = ''

      const largeurDispo = Math.min((container.clientWidth || 360) - 24, 900)
      const dpr = window.devicePixelRatio || 1

      for (let n = 1; n <= pdf.numPages; n++) {
        if (estAnnule()) return
        const page = await pdf.getPage(n)
        const base = page.getViewport({ scale: 1 })
        const echelle = largeurDispo / base.width
        const viewport = page.getViewport({ scale: echelle })

        const canvas = document.createElement('canvas')
        canvas.width = Math.floor(viewport.width * dpr)
        canvas.height = Math.floor(viewport.height * dpr)
        canvas.style.width = viewport.width + 'px'
        canvas.style.height = viewport.height + 'px'
        canvas.style.display = 'block'
        canvas.style.margin = '0 auto 12px'
        canvas.style.borderRadius = '4px'
        canvas.style.boxShadow = '0 2px 12px rgba(0,0,0,0.45)'
        container.appendChild(canvas)

        const ctx = canvas.getContext('2d')
        ctx.scale(dpr, dpr)
        await page.render({ canvasContext: ctx, viewport }).promise
      }
    } catch (e) {
      if (!estAnnule()) setErreur(e.message || 'Erreur lors de l\'affichage du document')
    } finally {
      if (!estAnnule()) setLoading(false)
    }
  }

  // Filet de sécurité : téléchargement du PDF si l'affichage échoue
  const telecharger = async () => {
    try {
      const buffer = await recupererBuffer()
      const url = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `${ressource.titre || nature}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
    } catch {
      toast.erreur('Téléchargement impossible pour le moment.')
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(7,16,32,0.97)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', flexShrink: 0, background: '#071020', borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <span style={{ color: '#C9A84C', display: 'flex', flexShrink: 0 }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-6-6Z" /><path d="M13 3v6h6" /><path d="M9 13h6M9 16.5h6" /></svg></span>
          <div style={{ minWidth: 0 }}>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ressource.titre}</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>{ressource.matiere} · {libelleContenu(ressource.concours)}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button onClick={telecharger} title="Télécharger" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#e5e7eb', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center' }} aria-label="Télécharger">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4v11M7.5 11l4.5 4.5 4.5-4.5M5 20h14" /></svg>
          </button>
          <button onClick={onFermer} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#e5e7eb', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            Fermer
          </button>
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Zone de rendu des canvas (peuplée manuellement) */}
        <div ref={containerRef} style={{ position: 'absolute', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: 12 }} />

        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'rgba(7,16,32,0.85)' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(201,168,76,0.3)', borderTopColor: '#C9A84C', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>{evaluation ? "Chargement de l'évaluation..." : 'Chargement du document...'}</p>
          </div>
        )}
        {erreur && !loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: 'rgba(7,16,32,0.9)', padding: 24, textAlign: 'center' }}>
            <p style={{ color: '#e5e7eb', fontSize: 16 }}>{erreur}</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => afficherPDF()} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#e5e7eb', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>
                Réessayer
              </button>
              <button onClick={telecharger} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#e5e7eb', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>
                Télécharger le PDF
              </button>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
