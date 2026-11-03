import { lazy, Suspense, useEffect, useState } from 'react'
import api from '../../api'
import { libelleConcours, viseConcours } from '../../lib/concours'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'

// recharts est chargé à la demande (module séparé)
const CourbeNotes = lazy(() => import('../../components/Graphiques').then(m => ({ default: m.CourbeNotes })))

const COULEURS = ['#C9A84C', '#4C7BC9', '#4CC9A8', '#7B4CC9', '#C94C7B', '#C97B4C']
const couleurNote = (n) => (n >= 14 ? '#2a9d7f' : n >= 10 ? '#a8872f' : '#C94C7B')
const formaterDate = (iso) => (iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '')

// Tableau de bord des notes de l'élève : moyenne, courbes par matière, dernières corrections, rang (optionnel)
export default function TableauNotesEleve({ concours }) {
  const [donnees, setDonnees] = useState(null)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let actif = true
    api.get('/api/tableaux/eleve')
      .then(res => {
        if (!actif) return
        if (res.ok) setDonnees(res.data)
        else setErreur(res.data?.message || 'Impossible de charger vos notes')
      })
      .catch(() => actif && setErreur('Erreur de connexion au serveur'))
    return () => { actif = false }
  }, [])

  if (erreur) return <p className="text-sm" style={{ color: '#C94C7B' }}>{erreur}</p>
  if (!donnees) return <Loader texte="Chargement…" />
  // Le serveur ne renvoie déjà que les concours de l'élève ; on isole ici celui qui est affiché
  const matieres = donnees.matieres.filter(m => viseConcours(m.concours, concours))
  const dernieres = donnees.dernieres.filter(n => viseConcours(n.concours, concours))
  const rangs = donnees.rangs.filter(r => r.concours_code === concours)
  // Le serveur applique le même critère que viseConcours() ; repli sur la moyenne des matières si la valeur manque
  const moyenneGenerale = donnees.moyennes_concours?.[concours]
    ?? (matieres.length ? Math.round((matieres.reduce((s, m) => s + m.moyenne, 0) / matieres.length) * 100) / 100 : 0)
  if (matieres.length === 0) return <EmptyState icone="📊" titre={`Aucune note ${libelleConcours(concours)} pour le moment`} />

  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #f0ece0' }}>
          <p className="text-xs text-gray-500 uppercase tracking-widest">Moyenne générale</p>
          <p className="text-3xl font-bold mt-1" style={{ color: couleurNote(moyenneGenerale) }}>
            {moyenneGenerale}<span className="text-sm text-gray-500"> / 20</span>
          </p>
        </div>
        {rangs.map(r => (
          <div key={r.concours_code} className="bg-white rounded-2xl p-4" style={{ border: '1px solid #f0ece0' }}>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Rang {libelleConcours(r.concours_code)}</p>
            <p className="text-3xl font-bold mt-1" style={{ color: '#7B4CC9' }}>{r.rang}<span className="text-sm text-gray-500"> / {r.sur}</span></p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        {matieres.map((m, i) => (
          <div key={`${m.concours}|${m.matiere}`} className="bg-white rounded-2xl p-4" style={{ border: '1px solid #f0ece0' }}>
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500">{m.concours}</p>
                <h3 className="font-bold text-sm" style={{ color: '#071020' }}>{m.matiere}</h3>
              </div>
              <p className="text-lg font-bold" style={{ color: couleurNote(m.moyenne) }}>{m.moyenne} <span className="text-xs text-gray-500">moy.</span></p>
            </div>
            {m.points.length > 1 ? (
              <Suspense fallback={<div className="h-[180px] flex items-center justify-center text-xs text-gray-500">Chargement du graphique…</div>}>
                <CourbeNotes points={m.points} couleur={COULEURS[i % COULEURS.length]} />
              </Suspense>
            ) : (
              <p className="text-xs text-gray-500 py-6 text-center">La courbe apparaît à partir de deux notes ({m.points[0].periode} : {m.points[0].note} / 20).</p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #f0ece0' }}>
        <h3 className="font-bold text-sm mb-3" style={{ color: '#071020' }}>Dernières corrections</h3>
        <ul className="flex flex-col gap-2">
          {dernieres.map((n, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{n.matiere} <span className="text-xs text-gray-500">· {n.periode} · {formaterDate(n.date)}</span></span>
              <span className="font-bold" style={{ color: couleurNote(n.note) }}>{n.note} / 20</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
