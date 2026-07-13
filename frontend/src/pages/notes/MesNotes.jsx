import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import API_URL from '../../config'

// Sections par concours affichées dans "Mes notes", dans cet ordre.
// Les libellés correspondent aux valeurs stockées dans la table "notes"
// (saisie manuelle par le professeur ou notes générées automatiquement par Genius Eval).
const SECTIONS_CONCOURS = [
  { val: 'INP-HB', label: 'INP-HB', couleur: '#C9A84C' },
  { val: 'ESATIC', label: 'ESATIC', couleur: '#4C7BC9' },
  { val: 'CME', label: 'CME', couleur: '#7B4CC9' },
  { val: 'tous', label: 'Général', couleur: '#4CC9A8' },
]

export default function MesNotes() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const isProfOrAdmin = ['professeur', 'admin'].includes(user?.role)
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isProfOrAdmin) { setLoading(false); return }
    const charger = async () => {
      try {
        const res = await fetch(`${API_URL}/api/notes/mes-notes`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        if (data.notes) setNotes(data.notes)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    charger()
  }, [])

  const getCouleur = (note) => note >= 14 ? '#4CC9A8' : note >= 10 ? '#C9A84C' : '#C94C7B'
  const moyenne = notes.length > 0 ? notes.reduce((s, n) => s + n.note, 0) / notes.length : 0

  // Regroupement des notes par concours (INP-HB / ESATIC / CME / Général),
  // avec repli sur "Général" pour d'éventuelles notes sans concours renseigné.
  const notesParConcours = notes.reduce((acc, n) => {
    const key = n.concours || 'tous'
    if (!acc[key]) acc[key] = []
    acc[key].push(n)
    return acc
  }, {})
  const sectionsAffichees = SECTIONS_CONCOURS
    .filter(s => notesParConcours[s.val]?.length > 0)
    .map(s => ({ ...s, notes: notesParConcours[s.val] }))

  if (isProfOrAdmin) {
    return (
      <div className="p-4 md:p-6 min-h-screen flex items-center justify-center" style={{ background: '#f8f7f4' }}>
        <div className="rounded-2xl p-8 text-center max-w-md"
          style={{ background: 'linear-gradient(135deg, #071020, #0d1f3c)', border: '1px solid rgba(201,168,76,0.3)' }}>
          <p className="text-3xl mb-3">📝</p>
          <p className="font-bold text-white mb-2">Gestion des notes</p>
          <p className="text-xs text-gray-400 mb-5">
            La saisie et la gestion des notes des étudiants se fait depuis l'espace professeur.
          </p>
          <button onClick={() => navigate('/professeur')}
            className="px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #b8891e, #C9A84C)', color: '#071020' }}>
            Aller à l'espace professeur →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>
      <div className="mb-6">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>Outils</p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>Mes notes</h1>
        <p className="text-gray-400 text-sm mt-1">Bulletin de notes — {user?.prenom} {user?.nom || user?.username}</p>
      </div>

      <div className="rounded-2xl p-5 mb-6 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #071020, #0d1f3c)', border: '1px solid rgba(201,168,76,0.3)' }}>
        <div>
          <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(201,168,76,0.7)' }}>Moyenne générale</p>
          <p className="text-4xl font-bold" style={{ color: getCouleur(moyenne) }}>
            {loading ? '...' : moyenne.toFixed(2)}/20
          </p>
        </div>
        <span className="text-5xl">🎓</span>
      </div>

      {loading ? (
        <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #f0ece0' }}>
          <p className="text-xs text-gray-400 text-center py-8">Chargement...</p>
        </div>
      ) : notes.length === 0 ? (
        <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #f0ece0' }}>
          <p className="text-xs text-gray-400 text-center py-8">Aucune note disponible pour le moment</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {sectionsAffichees.map(section => {
            const moyenneSection = section.notes.reduce((s, n) => s + n.note, 0) / section.notes.length
            return (
              <div key={section.val} className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #f0ece0' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1 rounded-full"
                      style={{ background: `${section.couleur}1A`, color: section.couleur, border: `1px solid ${section.couleur}4D` }}>
                      {section.label}
                    </span>
                    <span className="text-xs text-gray-400">{section.notes.length} note{section.notes.length > 1 ? 's' : ''}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: getCouleur(moyenneSection) }}>
                    Moy. {moyenneSection.toFixed(2)}/20
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #f0ece0' }}>
                        <th className="text-left py-2 px-2 text-gray-400 font-semibold">Matière</th>
                        <th className="text-left py-2 px-2 text-gray-400 font-semibold">Évaluation</th>
                        <th className="text-right py-2 px-2 text-gray-400 font-semibold">Note</th>
                        <th className="text-right py-2 px-2 text-gray-400 font-semibold">Appréciation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.notes.map((n, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f8f7f4' }}>
                          <td className="py-2.5 px-2 font-semibold" style={{ color: '#071020' }}>{n.matiere}</td>
                          <td className="py-2.5 px-2 text-gray-400">{n.periode || '—'}</td>
                          <td className="py-2.5 px-2 text-right font-bold" style={{ color: getCouleur(n.note) }}>{n.note}/20</td>
                          <td className="py-2.5 px-2 text-right">
                            <span style={{
                              fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
                              background: `${getCouleur(n.note)}1A`, color: getCouleur(n.note),
                              border: `1px solid ${getCouleur(n.note)}55`
                            }}>
                              {n.note >= 14 ? 'Très bien' : n.note >= 10 ? 'Satisfaisant' : 'À améliorer'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}