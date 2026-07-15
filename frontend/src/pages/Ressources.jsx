import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API_URL from '../config'
import Breadcrumb from '../components/Breadcrumb'

const ROLES_INPHB  = ['etudiant_inphb', 'etudiant_both', 'etudiant_inphb_cme', 'etudiant_all', 'professeur', 'admin']
const ROLES_ESATIC = ['etudiant_esatic', 'etudiant_both', 'etudiant_esatic_cme', 'etudiant_all', 'professeur', 'admin']
const ROLES_CME    = ['etudiant_cme', 'etudiant_inphb_cme', 'etudiant_esatic_cme', 'etudiant_all', 'professeur', 'admin']

// Une ressource correspond-elle à l'école affichée ?
// Inclusif : une ressource "tous"/"all" ou combinée apparaît sous chaque école concernée.
function correspondEcole(concours, sigle) {
  const c = (concours || '').toString().trim().toLowerCase()
  const s = (sigle || '').toString().trim().toLowerCase()
  if (c === 'tous' || c === 'all') return true
  if (s.includes('inp'))    return c.includes('inp')
  if (s.includes('esatic')) return c.includes('esatic')
  if (s.includes('cme'))    return c.includes('cme')
  return c === s
}

const ecoles = [
  {
    sigle: 'INP-HB',
    nom: 'Institut National Polytechnique Houphouët-Boigny',
    logo: 'https://inphb.edu.ci/wp-content/uploads/2020/03/INPHB.png',
    couleur: '#C9A84C',
    matieres: ['Culture Générale', 'Culture Scientifique', 'Culture Littéraire'],
    roles: ROLES_INPHB,
    description: 'Documents et annales pour le concours INP-HB'
  },
  {
    sigle: 'ESATIC',
    nom: 'Ecole Supérieure Africaine des TIC',
    logo: 'https://esatic.ci/wp-content/uploads/2024/07/esatic_logo.jpg',
    couleur: '#4C7BC9',
    matieres: ['Mathématiques', 'Physique', 'Anglais', 'Français'],
    roles: ROLES_ESATIC,
    description: 'Documents et annales pour le concours ESATIC'
  },
  {
    sigle: 'CME',
    nom: 'Concours des Meilleurs Etudiants',
    logo: '/cme-logo.png',
    couleur: '#4CC9A8',
    matieres: ['Culture Générale', 'Culture Scientifique', 'Anglais', 'Français'],
    roles: ROLES_CME,
    description: 'Documents et annales pour le concours CME'
  },
]

const typeConfig = {
  pdf:      { label: 'PDF',      couleur: '#C9A84C', icone: '📄' },
  video:    { label: 'Vidéo',    couleur: '#4C7BC9', icone: '🎥' },
  exercice: { label: 'Exercice', couleur: '#C94C7B', icone: '✏️' },
  lien:     { label: 'Lien',     couleur: '#4CC9A8', icone: '🔗' },
}

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

function LecteurPDF({ ressource, token, onFermer }) {
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
    const res = await fetch(`${API_URL}/api/ressources/ouvrir/${ressource.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Impossible de charger le document')
    }
    return res.arrayBuffer()
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
      a.download = `${ressource.titre || 'document'}.pdf`
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
          <span style={{ fontSize: 24 }}>📄</span>
          <div style={{ minWidth: 0 }}>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ressource.titre}</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>{ressource.matiere} · {ressource.concours}</p>
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
        {/* Zone de rendu des canvas (peuplée manuellement) */}
        <div ref={containerRef} style={{ position: 'absolute', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: 12 }} />

        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'rgba(7,16,32,0.85)' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(201,168,76,0.3)', borderTopColor: '#C9A84C', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Chargement du document...</p>
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
// PAGE PRINCIPALE
// ══════════════════════════════════════════
export default function Ressources() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [ecoleSelectionnee, setEcoleSelectionnee] = useState(null)
  const [matiereSelectionnee, setMatiereSelectionnee] = useState(null)
  const [ressources, setRessources] = useState([])
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')
  const [ressourceOuverte, setRessourceOuverte] = useState(null)

  const ecoleActive = ecoles.find(e => e.sigle === ecoleSelectionnee)
  const peutAcceder = (ecole) => ecole.roles.includes(user?.role)

  useEffect(() => {
    if (ecoleSelectionnee) chargerRessources()
  }, [ecoleSelectionnee])

  const chargerRessources = async () => {
    setLoading(true)
    setErreur('')
    try {
      const res = await fetch(`${API_URL}/api/ressources`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.ressources) {
        setRessources(data.ressources.filter(r => correspondEcole(r.concours, ecoleSelectionnee)))
      } else {
        setErreur('Erreur lors du chargement')
      }
    } catch {
      setErreur('Erreur serveur')
    } finally {
      setLoading(false)
    }
  }

  const ressourcesFiltrees = matiereSelectionnee
    ? ressources.filter(r => r.matiere === matiereSelectionnee)
    : ressources

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>

      {ressourceOuverte && (
        <LecteurPDF ressource={ressourceOuverte} token={token} onFermer={() => setRessourceOuverte(null)} />
      )}

      {/* EN-TÊTE */}
      <div className="mb-6">
        <Breadcrumb
          retourLabel={matiereSelectionnee ? ecoleActive?.sigle : ecoleActive ? 'Tous les documents' : undefined}
          onRetour={
            matiereSelectionnee ? () => setMatiereSelectionnee(null)
            : ecoleActive ? () => { setEcoleSelectionnee(null); setMatiereSelectionnee(null) }
            : undefined
          }
          suivantLabel={!ecoleActive ? 'Mon Planning' : null}
          suivantPath={!ecoleActive ? '/planning/emploi-du-temps' : null}
        />
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>Bibliothèque</p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>
          {!ecoleActive && 'Tous les Documents'}
          {ecoleActive && !matiereSelectionnee && `Documents ${ecoleActive.sigle}`}
          {matiereSelectionnee && matiereSelectionnee}
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {!ecoleActive && 'Sélectionnez votre concours pour accéder aux documents'}
          {ecoleActive && !matiereSelectionnee && `Choisissez une matière — ${ecoleActive.matieres.length} matières disponibles`}
          {matiereSelectionnee && `${ressourcesFiltrees.length} document(s) disponible(s)`}
        </p>
      </div>

      {/* NIVEAU 1 — Choix du concours — TOUS AFFICHÉS, non inscrit grisé */}
      {!ecoleSelectionnee && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ecoles.map((ecole, i) => {
            const acces = peutAcceder(ecole)
            return (
              <div key={i}
                onClick={() => acces && setEcoleSelectionnee(ecole.sigle)}
                className="rounded-2xl overflow-hidden transition-all duration-200 relative"
                style={{
                  background: 'linear-gradient(135deg, #071020, #0d1f3c)',
                  border: acces ? `2px solid ${ecole.couleur}40` : '2px solid rgba(255,255,255,0.05)',
                  cursor: acces ? 'pointer' : 'default',
                  opacity: acces ? 1 : 0.7,
                }}
                onMouseEnter={e => acces && (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>

                {/* Badge "Non inscrit" pour les concours non accessibles */}
                {!acces && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12, zIndex: 10,
                    background: 'rgba(156,163,175,0.2)', border: '1px solid rgba(156,163,175,0.3)',
                    color: '#9ca3af', fontSize: 10, fontWeight: 700,
                    padding: '3px 10px', borderRadius: 20, letterSpacing: '0.05em'
                  }}>
                    🔒 Non inscrit
                  </div>
                )}

                <div className="flex items-center justify-center py-10 px-8">
                  <img src={ecole.logo} alt={ecole.sigle}
                    style={{ maxHeight: 100, maxWidth: 200, objectFit: 'contain', filter: acces ? 'none' : 'grayscale(100%)' }}
                    onError={e => {
                      e.target.style.display = 'none'
                      e.target.parentNode.innerHTML = `<span style="font-size:38px;font-weight:900;color:${acces ? ecole.couleur : '#6b7280'}">${ecole.sigle}</span>`
                    }} />
                </div>

                <div className="h-0.5" style={{ background: acces ? `linear-gradient(90deg, transparent, ${ecole.couleur}, transparent)` : 'rgba(255,255,255,0.05)' }} />

                <div className="px-6 py-4">
                  <p className="font-bold text-sm" style={{ color: acces ? 'white' : '#6b7280' }}>{ecole.sigle}</p>
                  <p className="text-xs mt-0.5" style={{ color: acces ? '#9ca3af' : '#4b5563' }}>{ecole.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs" style={{ color: acces ? '#6b7280' : '#4b5563' }}>
                      {ecole.matieres.length} matières
                    </span>
                    {acces ? (
                      <span className="text-xs font-semibold px-3 py-1 rounded-lg"
                        style={{ background: `${ecole.couleur}20`, color: ecole.couleur }}>
                        Accéder →
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-3 py-1 rounded-lg"
                        style={{ background: 'rgba(107,114,128,0.1)', color: '#6b7280' }}>
                        Contacter l'admin
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* NIVEAU 2 — Choix de la matière */}
      {ecoleActive && !matiereSelectionnee && (
        <div>
          <div className="rounded-2xl overflow-hidden mb-6" style={{ border: '1px solid #f0ece0' }}>
            <div className="flex items-center gap-4 p-5"
              style={{ background: 'linear-gradient(135deg, #071020, #0d1f3c)', borderBottom: `2px solid ${ecoleActive.couleur}` }}>
              <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center p-1.5 flex-shrink-0">
                <img src={ecoleActive.logo} alt={ecoleActive.sigle} className="w-full h-full object-contain"
                  onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = `<span style="font-weight:900;color:${ecoleActive.couleur};font-size:14px">${ecoleActive.sigle}</span>` }} />
              </div>
              <div>
                <p className="text-white font-bold text-lg">{ecoleActive.sigle}</p>
                <p className="text-xs text-gray-400 mt-0.5">{ecoleActive.nom}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ecoleActive.matieres.map((matiere, i) => {
              const count = ressources.filter(r => r.matiere === matiere).length
              return (
                <div key={i} onClick={() => setMatiereSelectionnee(matiere)}
                  className="bg-white rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-lg"
                  style={{ border: '1px solid #f0ece0' }}>
                  <div className="h-1.5" style={{ background: ecoleActive.couleur }} />
                  <div className="p-5">
                    <p className="font-bold text-sm mb-2" style={{ color: '#071020' }}>{matiere}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{loading ? '...' : `${count} document(s)`}</span>
                      <span className="text-xs font-semibold px-2 py-1 rounded-lg"
                        style={{ background: `${ecoleActive.couleur}15`, color: ecoleActive.couleur }}>
                        Consulter →
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* NIVEAU 3 — Documents de la matière */}
      {matiereSelectionnee && (
        <div>
          <div className="rounded-2xl overflow-hidden mb-6" style={{ border: '1px solid #f0ece0' }}>
            <div className="p-5"
              style={{ background: 'linear-gradient(135deg, #071020, #0d1f3c)', borderBottom: `2px solid ${ecoleActive?.couleur}` }}>
              <p className="font-bold text-xl text-white">{matiereSelectionnee}</p>
              <p className="text-xs mt-1" style={{ color: ecoleActive?.couleur }}>
                {ecoleActive?.sigle} · {ressourcesFiltrees.length} document(s)
              </p>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }} />
            </div>
          )}

          {erreur && <div className="text-center py-8 text-sm text-red-400">{erreur}</div>}

          {!loading && !erreur && (
            <div className="flex flex-col gap-3">
              {ressourcesFiltrees.length === 0 && (
                <div className="bg-white rounded-2xl p-10 text-center" style={{ border: '1px solid #f0ece0' }}>
                  <p className="text-3xl mb-3">📭</p>
                  <p className="text-sm font-semibold text-gray-500">Aucun document disponible</p>
                  <p className="text-xs text-gray-400 mt-1">Votre enseignant n'a pas encore publié de contenu ici.</p>
                </div>
              )}
              {ressourcesFiltrees.map((ressource, i) => {
                const config = typeConfig[ressource.type] || { label: ressource.type, couleur: '#9ca3af', icone: '📎' }
                return (
                  <div key={i}
                    className="bg-white rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-all hover:shadow-lg"
                    style={{ border: '1px solid #f0ece0' }}
                    onClick={() => setRessourceOuverte(ressource)}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                      style={{ background: `${config.couleur}15` }}>
                      {config.icone}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-800">{ressource.titre}</p>
                      {ressource.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{ressource.description}</p>}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: `${config.couleur}15`, color: config.couleur }}>
                          {config.label}
                        </span>
                        {ressource.professeur && (
                          <span className="text-xs text-gray-400">
                            Par {ressource.professeur.prenom || ressource.professeur.username}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {new Date(ressource.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-3 py-2 rounded-xl flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #071020, #0d1f3c)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}>
                      Lire →
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}