import { lazy, Suspense, useEffect, useState } from 'react'
import api from '../../api'
import { couleurConcours } from '../../lib/concours'
import Loader from '../../components/Loader'

const Histogramme = lazy(() => import('../../components/Graphiques').then(m => ({ default: m.Histogramme })))

// Vue globale par concours : effectifs, moyennes, taux de remplissage des auto-évaluations
export default function VueGlobale() {
  const [concours, setConcours] = useState(null)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let actif = true
    api.get('/api/tableaux/admin')
      .then(res => {
        if (!actif) return
        if (res.ok) setConcours(res.data.concours)
        else setErreur(res.data?.message || 'Chargement impossible')
      })
      .catch(() => actif && setErreur('Erreur de connexion au serveur'))
    return () => { actif = false }
  }, [])

  if (erreur) return <p className="text-sm" style={{ color: '#C94C7B' }}>{erreur}</p>
  if (!concours) return <Loader texte="Chargement…" />

  const avecEleves = concours.filter(c => c.nb_eleves > 0 || c.nb_notes > 0)
  const moyennes = avecEleves.filter(c => c.moyenne !== null).map(c => ({ nom: c.nom, valeur: c.moyenne }))
  const taux = avecEleves.filter(c => c.taux_autoeval !== null).map(c => ({ nom: c.nom, valeur: c.taux_autoeval }))

  return (
    <div>
      <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#7B4CC9' }}>Administration</p>
      <h1 className="text-2xl font-bold mb-5" style={{ color: '#071020' }}>Vue globale par concours</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {concours.map(c => (
          <div key={c.code} className="rounded-2xl p-4 bg-white" style={{ border: '1px solid #f0ece0', borderTop: `4px solid ${couleurConcours(c.code)}` }}>
            <h3 className="font-bold" style={{ color: '#071020' }}>{c.nom}</h3>
            <dl className="mt-2 text-sm text-gray-600 grid grid-cols-2 gap-y-1">
              <dt>Élèves</dt><dd className="text-right font-semibold">{c.nb_eleves}</dd>
              <dt>Notes saisies</dt><dd className="text-right font-semibold">{c.nb_notes}</dd>
              <dt>Moyenne</dt><dd className="text-right font-semibold">{c.moyenne ?? '—'}{c.moyenne !== null && ' / 20'}</dd>
              <dt>Séances terminées</dt><dd className="text-right font-semibold">{c.nb_seances_terminees}</dd>
              <dt>Auto-évaluations</dt><dd className="text-right font-semibold">{c.taux_autoeval !== null ? `${c.taux_autoeval} %` : '—'}</dd>
            </dl>
            {c.autoeval_bloquante && <p className="text-xs mt-2 text-gray-400">Auto-évaluation bloquante</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #f0ece0' }}>
          <h3 className="font-bold text-sm mb-2" style={{ color: '#071020' }}>Moyenne par concours (/20)</h3>
          {moyennes.length === 0 ? <p className="text-xs text-gray-400 py-8 text-center">Pas encore de notes.</p> : (
            <Suspense fallback={<Loader texte="Chargement du graphique…" />}>
              <Histogramme data={moyennes} max={20} />
            </Suspense>
          )}
        </div>
        <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #f0ece0' }}>
          <h3 className="font-bold text-sm mb-2" style={{ color: '#071020' }}>Taux de remplissage des auto-évaluations (%)</h3>
          {taux.length === 0 ? <p className="text-xs text-gray-400 py-8 text-center">Aucune séance terminée avec des compétences.</p> : (
            <Suspense fallback={<Loader texte="Chargement du graphique…" />}>
              <Histogramme data={taux} max={100} unite=" %" couleur="#4CC9A8" />
            </Suspense>
          )}
        </div>
      </div>

      {concours.filter(c => c.seances.length > 0).map(c => (
        <div key={c.code} className="bg-white rounded-2xl p-4 mb-4" style={{ border: '1px solid #f0ece0' }}>
          <h3 className="font-bold text-sm mb-2" style={{ color: '#071020' }}>Dernières séances — {c.nom}</h3>
          <ul className="flex flex-col gap-1 text-sm">
            {c.seances.map(s => (
              <li key={s.id} className="flex justify-between text-gray-600">
                <span>{s.titre} <span className="text-xs text-gray-400">· {new Date(s.fin).toLocaleDateString('fr-FR')}</span></span>
                <span className="font-semibold">{s.nb_complets} / {s.nb_eleves}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
