import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import API_URL from '../config'

const ROLES_INPHB  = ['etudiant_inphb', 'etudiant_both', 'etudiant_inphb_cme', 'etudiant_all', 'professeur', 'admin']
const ROLES_ESATIC = ['etudiant_esatic', 'etudiant_both', 'etudiant_esatic_cme', 'etudiant_all', 'professeur', 'admin']
const ROLES_CME    = ['etudiant_cme', 'etudiant_inphb_cme', 'etudiant_esatic_cme', 'etudiant_all', 'professeur', 'admin']

const ecoles = [
  {
    sigle: 'INP-HB',
    nom: 'Institut National Polytechnique Houphouët-Boigny',
    logo: 'https://inphb.edu.ci/wp-content/uploads/2020/03/INPHB.png',
    couleur: '#C9A84C',
    matieres: ['Culture Générale', 'Culture Scientifique', 'Culture Littéraire'],
    roles: ROLES_INPHB
  },
  {
    sigle: 'ESATIC',
    nom: 'Ecole Supérieure Africaine des TIC',
    logo: 'https://esatic.ci/wp-content/uploads/2024/07/esatic_logo.jpg',
    couleur: '#4C7BC9',
    matieres: ['Mathématiques', 'Physique', 'Anglais', 'Français'],
    roles: ROLES_ESATIC
  },
  {
    sigle: 'CME',
    nom: 'Concours des Meilleurs Etudiants',
    logo: '/cme-logo.png',
    couleur: '#4CC9A8',
    matieres: ['Culture Générale', 'Culture Scientifique', 'Anglais', 'Français'],
    roles: ROLES_CME
  },
]

const typeConfig = {
  pdf:      { label: 'PDF',      couleur: '#C9A84C' },
  video:    { label: 'Video',    couleur: '#4C7BC9' },
  exercice: { label: 'Exercice', couleur: '#C94C7B' },
}

// ══════════════════════════════════════════
// LECTEUR PDF INTÉGRÉ
// ══════════════════════════════════════════
function LecteurPDF({ ressource, token, onFermer }) {
  const [blobUrl, setBlobUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    chargerPDF()
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [])

  const chargerPDF = async () => {
    try {
      setLoading(true)
      setErreur('')
      const res = await fetch(`${API_URL}/api/ressources/ouvrir/${ressource.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setErreur(err.message || 'Impossible de charger le document')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setBlobUrl(url)
    } catch {
      setErreur('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(7,16,32,0.95)',
      display: 'flex', flexDirection: 'column'
    }}>
      {/* Barre du haut */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', flexShrink: 0,
        background: '#071020', borderBottom: '1px solid rgba(201,168,76,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(201,168,76,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16
          }}>📄</div>
          <div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: 0 }}>
              {ressource.titre}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
              {ressource.matiere} · {ressource.concours}
            </p>
          </div>
        </div>
        <button onClick={onFermer} style={{
          background: 'rgba(201,76,123,0.15)', border: '1px solid rgba(201,76,123,0.3)',
          color: '#C94C7B', borderRadius: 8, padding: '6px 14px',
          fontSize: 13, fontWeight: 600, cursor: 'pointer'
        }}>
          ✕ Fermer
        </button>
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {loading && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 16
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              border: '3px solid rgba(201,168,76,0.3)',
              borderTopColor: '#C9A84C',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
              Chargement du document...
            </p>
          </div>
        )}

        {erreur && !loading && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12
          }}>
            <p style={{ color: '#C94C7B', fontSize: 16 }}>⚠️ {erreur}</p>
            <button onClick={chargerPDF} style={{
              background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)',
              color: '#C9A84C', borderRadius: 8, padding: '8px 16px',
              fontSize: 13, cursor: 'pointer'
            }}>
              Réessayer
            </button>
          </div>
        )}

        {blobUrl && !loading && (
          <iframe
            src={blobUrl}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title={ressource.titre}
          />
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

// ══════════════════════════════════════════
// PAGE PRINCIPALE RESSOURCES
// ══════════════════════════════════════════
export default function Ressources() {
  const { user, token } = useAuth()
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
      const res = await fetch(`${API_URL}/api/ressources`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.ressources) {
        setRessources(data.ressources.filter(r =>
          r.concours === ecoleSelectionnee || r.concours === 'tous'
        ))
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

      {/* Lecteur PDF intégré */}
      {ressourceOuverte && (
        <LecteurPDF
          ressource={ressourceOuverte}
          token={token}
          onFermer={() => setRessourceOuverte(null)}
        />
      )}

      {/* EN-TETE */}
      <div className="mb-6 md:mb-8">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>Ressources</p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>
          {!ecoleActive && 'Centre de ressources'}
          {ecoleActive && !matiereSelectionnee && ecoleActive.sigle}
          {matiereSelectionnee && matiereSelectionnee}
        </h1>
        {/* Fil d'Ariane */}
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 flex-wrap">
          <button onClick={() => { setEcoleSelectionnee(null); setMatiereSelectionnee(null) }}
            style={{ color: ecoleActive ? '#C9A84C' : '#9ca3af' }}>
            Ressources
          </button>
          {ecoleActive && (
            <>
              <span>/</span>
              <button onClick={() => setMatiereSelectionnee(null)}
                style={{ color: matiereSelectionnee ? '#C9A84C' : '#9ca3af' }}>
                {ecoleActive.sigle}
              </button>
            </>
          )}
          {matiereSelectionnee && (
            <><span>/</span><span className="text-gray-600">{matiereSelectionnee}</span></>
          )}
        </div>
      </div>

      {/* NIVEAU 1 — Choix du concours */}
      {!ecoleSelectionnee && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ecoles.map((ecole, i) => {
            const acces = peutAcceder(ecole)
            return (
              <div key={i}
                onClick={() => acces && setEcoleSelectionnee(ecole.sigle)}
                className="rounded-2xl overflow-hidden transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #071020, #0d1f3c)',
                  border: `2px solid ${ecole.couleur}40`,
                  cursor: acces ? 'pointer' : 'not-allowed',
                  opacity: acces ? 1 : 0.5,
                }}
                onMouseEnter={e => acces && (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <div className="flex items-center justify-center py-12 px-8">
                  <img src={ecole.logo} alt={ecole.sigle}
                    style={{ maxHeight: 120, maxWidth: 220, objectFit: 'contain' }}
                    onError={e => {
                      e.target.style.display = 'none'
                      e.target.parentNode.innerHTML = `<span style="font-size:42px;font-weight:900;color:${ecole.couleur}">${ecole.sigle}</span>`
                    }} />
                </div>
                <div className="h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${ecole.couleur}, transparent)` }} />
                <div className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-sm">{ecole.sigle}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{ecole.matieres.length} matières</p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-lg"
                    style={{ background: `${acces ? ecole.couleur : '#9ca3af'}20`, color: acces ? ecole.couleur : '#9ca3af' }}>
                    {acces ? 'Accéder' : 'Non inscrit'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* NIVEAU 2 — Choix de la matière */}
      {ecoleActive && !matiereSelectionnee && (
        <div>
          <button onClick={() => setEcoleSelectionnee(null)}
            className="flex items-center gap-2 mb-6 text-xs font-semibold"
            style={{ color: '#C9A84C' }}>
            ← Retour aux concours
          </button>
          <div className="rounded-2xl overflow-hidden mb-6" style={{ border: '1px solid #f0ece0' }}>
            <div className="flex items-center gap-4 p-5"
              style={{ background: 'linear-gradient(135deg, #071020, #0d1f3c)', borderBottom: `2px solid ${ecoleActive.couleur}` }}>
              <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center p-1.5 flex-shrink-0">
                <img src={ecoleActive.logo} alt={ecoleActive.sigle}
                  className="w-full h-full object-contain"
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
                  <div className="h-2" style={{ background: ecoleActive.couleur }} />
                  <div className="p-5">
                    <p className="font-bold text-sm mb-3" style={{ color: '#071020' }}>{matiere}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {loading ? '...' : `${count} ressource${count > 1 ? 's' : ''}`}
                      </span>
                      <span className="text-xs font-semibold px-2 py-1 rounded-lg"
                        style={{ background: `${ecoleActive.couleur}15`, color: ecoleActive.couleur }}>
                        Ouvrir
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* NIVEAU 3 — Liste des ressources */}
      {matiereSelectionnee && (
        <div>
          <button onClick={() => setMatiereSelectionnee(null)}
            className="flex items-center gap-2 mb-6 text-xs font-semibold"
            style={{ color: '#C9A84C' }}>
            ← Retour aux matières
          </button>
          <div className="rounded-2xl overflow-hidden mb-6" style={{ border: '1px solid #f0ece0' }}>
            <div className="p-5"
              style={{ background: 'linear-gradient(135deg, #071020, #0d1f3c)', borderBottom: `2px solid ${ecoleActive?.couleur}` }}>
              <p className="font-bold text-xl text-white">{matiereSelectionnee}</p>
              <p className="text-xs mt-1" style={{ color: ecoleActive?.couleur }}>
                {ecoleActive?.sigle} · {ressourcesFiltrees.length} ressource{ressourcesFiltrees.length > 1 ? 's' : ''}
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
                <div className="bg-white rounded-2xl p-8 text-center" style={{ border: '1px solid #f0ece0' }}>
                  <p className="text-2xl mb-2">📭</p>
                  <p className="text-sm text-gray-500">Aucune ressource disponible pour cette matière.</p>
                  <p className="text-xs text-gray-400 mt-1">Votre professeur n'a pas encore publié de contenu ici.</p>
                </div>
              )}
              {ressourcesFiltrees.map((ressource, i) => {
                const config = typeConfig[ressource.type] || { label: ressource.type, couleur: '#9ca3af' }
                return (
                  <div key={i}
                    className="bg-white rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-all hover:shadow-lg"
                    style={{ border: '1px solid #f0ece0' }}
                    onClick={() => setRessourceOuverte(ressource)}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                      style={{ background: config.couleur }}>
                      {config.label}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-800">{ressource.titre}</p>
                      {ressource.description && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{ressource.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full"
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
                    <div className="flex-shrink-0">
                      <span className="text-xs font-semibold px-3 py-2 rounded-xl"
                        style={{ background: 'linear-gradient(135deg, #071020, #0d1f3c)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}>
                        Lire
                      </span>
                    </div>
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