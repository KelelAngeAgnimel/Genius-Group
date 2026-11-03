import { useEffect, useState } from 'react'
import api from '../../api'
import Loader from '../../components/Loader'
import { CONCOURS, viseConcours } from '../../lib/concours'
import { cleMatiere, couleurNote, profilDepuisNotes } from '../../lib/profil'

// Bulletin d'un concours : notes détaillées et moyenne par matière (la moyenne générale est dans TableauNotesEleve).
// Le serveur ne renvoie déjà que les notes des concours de l'élève ; on isole ici le concours affiché.
export default function MesNotes({ concours }) {
  const [notes, setNotes] = useState(null)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let actif = true
    api.get('/api/notes/mes-notes')
      .then(res => {
        if (!actif) return
        if (res.ok) setNotes(res.data.notes ?? [])
        else setErreur(res.data?.message || 'Impossible de charger vos notes')
      })
      .catch(() => actif && setErreur('Erreur de connexion au serveur'))
    return () => { actif = false }
  }, [])

  if (erreur) return <p className="text-sm" style={{ color: '#C94C7B' }}>{erreur}</p>
  if (!notes) return <Loader texte="Chargement…" />

  const notesConcours = notes.filter(n => viseConcours(n.concours, concours))
  // Matières officielles du concours d'abord (même sans note), puis celles trouvées dans les notes
  const matieres = [...(CONCOURS[concours]?.matieres ?? [])]
  for (const n of notesConcours) if (!matieres.some(m => cleMatiere(m) === cleMatiere(n.matiere))) matieres.push(n.matiere)

  return (
    <div>
      <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: '#fff', border: '1px solid #f0ece0' }}>
        {matieres.map(matiere => {
          const notesMatiere = notesConcours.filter(n => cleMatiere(n.matiere) === cleMatiere(matiere))
          const moyenneMatiere = notesMatiere.length ? profilDepuisNotes(notesMatiere).moyenneGenerale : null
          return (
            <div key={cleMatiere(matiere)}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold" style={{ color: '#071020' }}>{matiere}</p>
                {moyenneMatiere !== null && (
                  <span className="text-xs font-bold" style={{ color: couleurNote(moyenneMatiere) }}>Moy. {moyenneMatiere.toFixed(2)}/20</span>
                )}
              </div>
              {notesMatiere.length === 0 ? (
                <p className="text-xs text-gray-500 italic pl-2">Aucune note pour le moment</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #f0ece0' }}>
                        <th className="text-left py-1.5 px-2 text-gray-500 font-semibold">Évaluation</th>
                        <th className="text-right py-1.5 px-2 text-gray-500 font-semibold">Note</th>
                        <th className="text-right py-1.5 px-2 text-gray-500 font-semibold">Appréciation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notesMatiere.map((n, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f8f7f4' }}>
                          <td className="py-2 px-2 text-gray-500">{n.periode || '—'}</td>
                          <td className="py-2 px-2 text-right font-bold" style={{ color: couleurNote(n.note) }}>{n.note}/20</td>
                          <td className="py-2 px-2 text-right">
                            <span style={{
                              fontSize: 10, padding: '2px 8px', borderRadius: 20,
                              background: `${couleurNote(n.note)}1A`, color: couleurNote(n.note), border: `1px solid ${couleurNote(n.note)}55`
                            }}>
                              {n.note >= 14 ? 'Très bien' : n.note >= 10 ? 'Satisfaisant' : 'À améliorer'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
