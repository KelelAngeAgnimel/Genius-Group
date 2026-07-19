import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import API_URL from '../../config'

const COULEURS = { or: '#C9A84C', bleu: '#4C7BC9', vert: '#4CC9A8', rose: '#C94C7B', navy: '#071020', violet: '#7B4CC9' }

// Libellé lisible du concours ciblé par une évaluation
function labelConcours(concours) {
  const c = (concours || '').toString().trim().toLowerCase()
  if (c === 'tous' || c === 'all') return 'Tous les concours'
  const parts = []
  if (c.includes('inp')) parts.push('INP-HB')
  if (c.includes('esatic')) parts.push('ESATIC')
  if (c.includes('cme')) parts.push('CME')
  return parts.length ? parts.join(' + ') : concours
}

// ══════════════════════════════════════════
// LECTEUR PDF INTÉGRÉ (identique à la Bibliothèque)
// ══════════════════════════════════════════
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

function LecteurPDF({ ressource, token, onFermer }) {
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const containerRef = useRef(null)

  useEffect(() => {
    let annule = false
    afficherPDF(() => annule)
    return () => { annule = true }
  }, [])

  const recupererBuffer = async () => {
    const res = await fetch(`${API_URL}/api/ressources/ouvrir/${ressource.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Impossible de charger le document')
    }
    return res.arrayBuffer()
  }

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

  const telecharger = async () => {
    try {
      const buffer = await recupererBuffer()
      const url = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `${ressource.titre || 'evaluation'}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
    } catch {
      alert('Téléchargement impossible pour le moment.')
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(7,16,32,0.97)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', flexShrink: 0, background: '#071020', borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <span style={{ fontSize: 24 }}>📝</span>
          <div style={{ minWidth: 0 }}>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ressource.titre}</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>{ressource.matiere} · {labelConcours(ressource.concours)}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button onClick={telecharger} title="Télécharger" style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', color: '#C9A84C', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            ⬇
          </button>
          <button onClick={onFermer} style={{ background: 'rgba(201,76,123,0.15)', border: '1px solid rgba(201,76,123,0.3)', color: '#C94C7B', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            ✕ Fermer
          </button>
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div ref={containerRef} style={{ position: 'absolute', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: 12 }} />

        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'rgba(7,16,32,0.85)' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(201,168,76,0.3)', borderTopColor: '#C9A84C', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Chargement de l'évaluation...</p>
          </div>
        )}
        {erreur && !loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: 'rgba(7,16,32,0.9)', padding: 24, textAlign: 'center' }}>
            <p style={{ color: '#C94C7B', fontSize: 16 }}>⚠️ {erreur}</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => afficherPDF()} style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', color: '#C9A84C', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>
                Réessayer
              </button>
              <button onClick={telecharger} style={{ background: 'rgba(76,123,201,0.15)', border: '1px solid rgba(76,123,201,0.3)', color: '#4C7BC9', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>
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

// ══════════════════════════════════════════
// VUE ÉTUDIANT — évaluations filtrées par son concours
// ══════════════════════════════════════════
function VueEtudiant({ token }) {
  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [matiere, setMatiere] = useState('toutes')
  const [ouverte, setOuverte] = useState(null)

  useEffect(() => {
    const charger = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API_URL}/api/ressources/evaluations`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        if (data.ressources) setEvaluations(data.ressources)
        else setErreur('Erreur lors du chargement')
      } catch { setErreur('Erreur serveur') }
      finally { setLoading(false) }
    }
    charger()
  }, [])

  const matieres = ['toutes', ...Array.from(new Set(evaluations.map(e => e.matiere).filter(Boolean)))]
  const liste = matiere === 'toutes' ? evaluations : evaluations.filter(e => e.matiere === matiere)

  return (
    <div>
      {ouverte && <LecteurPDF ressource={ouverte} token={token} onFermer={() => setOuverte(null)} />}

      {matieres.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-5">
          {matieres.map(m => (
            <button key={m} onClick={() => setMatiere(m)}
              className="px-4 py-2 rounded-xl text-xs font-bold transition"
              style={{
                background: matiere === m ? `linear-gradient(135deg, #b8891e, ${COULEURS.or})` : '#fff',
                color: matiere === m ? COULEURS.navy : '#9ca3af',
                border: `1px solid ${matiere === m ? COULEURS.or : '#f0ece0'}`
              }}>
              {m === 'toutes' ? 'Toutes les matières' : m}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-xs text-gray-400 text-center py-10">Chargement...</p>
      ) : erreur ? (
        <p className="text-xs text-center py-10" style={{ color: COULEURS.rose }}>{erreur}</p>
      ) : liste.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: '#fff', border: '1px solid #f0ece0' }}>
          <p className="text-3xl mb-3">📭</p>
          <p className="text-sm font-semibold text-gray-500">Aucune évaluation disponible</p>
          <p className="text-xs text-gray-400 mt-1">Vos enseignants n'ont pas encore publié d'évaluation pour vos concours.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {liste.map((ev, i) => (
            <div key={i}
              className="bg-white rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-all hover:shadow-lg"
              style={{ border: '1px solid #f0ece0' }}
              onClick={() => setOuverte(ev)}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                style={{ background: `${COULEURS.rose}15` }}>
                📝
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-800">{ev.titre}</p>
                {ev.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{ev.description}</p>}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${COULEURS.or}15`, color: '#b8891e' }}>{ev.matiere}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${COULEURS.bleu}15`, color: COULEURS.bleu }}>{labelConcours(ev.concours)}</span>
                  {ev.professeur && <span className="text-xs text-gray-400">Par {ev.professeur.prenom || ev.professeur.username}</span>}
                  <span className="text-xs text-gray-400">{new Date(ev.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
              <span className="text-xs font-semibold px-3 py-2 rounded-xl flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #071020, #0d1f3c)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}>
                Ouvrir →
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════
// VUE PROF / ADMIN — gestion des évaluations
// (le prof ne voit que les siennes, l'admin voit tout)
// ══════════════════════════════════════════
function VueProf({ token, role }) {
  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [ouverte, setOuverte] = useState(null)

  const charger = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/ressources/evaluations/gestion`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.ressources) setEvaluations(data.ressources)
      else setErreur(data.message || 'Erreur lors du chargement')
    } catch { setErreur('Erreur serveur') }
    finally { setLoading(false) }
  }

  useEffect(() => { charger() }, [])

  const basculerVisibilite = async (ev) => {
    try {
      const res = await fetch(`${API_URL}/api/ressources/${ev.id}/visibilite`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible: !ev.visible })
      })
      if (res.ok) setEvaluations(prev => prev.map(x => x.id === ev.id ? { ...x, visible: !ev.visible } : x))
      else { const d = await res.json().catch(() => ({})); alert(d.message || 'Action impossible') }
    } catch { alert('Erreur réseau') }
  }

  const supprimer = async (ev) => {
    if (!window.confirm('Supprimer cette évaluation ?')) return
    try {
      const res = await fetch(`${API_URL}/api/ressources/${ev.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setEvaluations(prev => prev.filter(x => x.id !== ev.id))
      else { const d = await res.json().catch(() => ({})); alert(d.message || 'Suppression impossible') }
    } catch { alert('Erreur réseau') }
  }

  return (
    <div>
      {ouverte && <LecteurPDF ressource={ouverte} token={token} onFermer={() => setOuverte(null)} />}

      <div className="rounded-2xl p-4 mb-5 flex items-start gap-3" style={{ background: `${COULEURS.or}0F`, border: `1px solid ${COULEURS.or}33` }}>
        <span className="text-lg">💡</span>
        <p className="text-xs text-gray-600">
          Pour ajouter une évaluation, allez dans <span className="font-semibold" style={{ color: '#b8891e' }}>Enseignant → Publier une ressource</span> et activez l'option
          <span className="font-semibold"> « Cette ressource est une évaluation »</span>. Elle apparaîtra ici et sera visible par les élèves selon le concours ciblé.
          {role !== 'admin' && ' Vous ne voyez que vos propres évaluations.'}
        </p>
      </div>

      {loading ? (
        <p className="text-xs text-gray-400 text-center py-10">Chargement...</p>
      ) : erreur ? (
        <p className="text-xs text-center py-10" style={{ color: COULEURS.rose }}>{erreur}</p>
      ) : evaluations.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: '#fff', border: '1px solid #f0ece0' }}>
          <p className="text-3xl mb-2">📭</p>
          <p className="text-sm text-gray-400">Aucune évaluation publiée pour le moment</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {evaluations.map((ev, i) => (
            <div key={i} className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #f0ece0' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs tracking-widest uppercase" style={{ color: COULEURS.or }}>{ev.matiere}</span>
                {!ev.visible && (
                  <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '10px', background: `${COULEURS.rose}1A`, color: COULEURS.rose }}>🚫 Masquée</span>
                )}
              </div>
              <p className="font-bold text-sm" style={{ color: COULEURS.navy }}>{ev.titre}</p>
              {ev.description && <p className="text-xs text-gray-500 mt-0.5">{ev.description}</p>}
              <p className="text-xs mt-1 flex items-start gap-1" style={{ color: COULEURS.bleu }}>
                <span>👥</span>
                <span>Visible par : {labelConcours(ev.concours)}</span>
              </p>
              {role === 'admin' && ev.professeur && (
                <p className="text-xs text-gray-400 mt-1">Publiée par {ev.professeur.prenom || ev.professeur.username}</p>
              )}
              <div className="flex gap-2 mt-3 flex-wrap">
                <button onClick={() => setOuverte(ev)} className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ background: `${COULEURS.bleu}1A`, color: COULEURS.bleu, border: `1px solid ${COULEURS.bleu}4D` }}>
                  Ouvrir
                </button>
                <button onClick={() => basculerVisibilite(ev)} className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={!ev.visible
                    ? { background: `${COULEURS.vert}1A`, color: COULEURS.vert, border: `1px solid ${COULEURS.vert}4D` }
                    : { background: 'rgba(230,150,40,0.12)', color: '#C97B1A', border: '1px solid rgba(230,150,40,0.3)' }}>
                  {!ev.visible ? 'Démasquer' : 'Masquer'}
                </button>
                <button onClick={() => supprimer(ev)} className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ background: `${COULEURS.rose}1A`, color: COULEURS.rose, border: `1px solid ${COULEURS.rose}4D` }}>
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════
export default function Evaluations() {
  const { user, token } = useAuth()
  const isProfOrAdmin = ['professeur', 'admin'].includes(user?.role)

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>
      <div className="mb-6">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: COULEURS.or }}>Outils</p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: COULEURS.navy }}>Évaluation</h1>
        <p className="text-gray-400 text-sm mt-1">
          {isProfOrAdmin ? 'Gérez les évaluations publiées' : 'Les évaluations publiées pour vos concours'}
        </p>
      </div>
      {isProfOrAdmin ? <VueProf token={token} role={user?.role} /> : <VueEtudiant token={token} />}
    </div>
  )
}