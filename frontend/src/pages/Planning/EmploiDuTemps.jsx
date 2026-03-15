import { useState } from 'react'

const heures = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']

const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

const evenements = [
  { jour: 'Lundi', debut: '08:00', fin: '10:00', titre: 'Mathématiques', type: 'cours', salle: 'Salle A1', couleur: '#C9A84C' },
  { jour: 'Lundi', debut: '10:00', fin: '12:00', titre: 'Physique', type: 'cours', salle: 'Labo B2', couleur: '#4CC9A8' },
  { jour: 'Mardi', debut: '08:00', fin: '10:00', titre: 'Culture Générale', type: 'cours', salle: 'Salle C3', couleur: '#7B4CC9' },
  { jour: 'Mardi', debut: '14:00', fin: '16:00', titre: 'Concours Blanc', type: 'examen', salle: 'Grand Hall', couleur: '#C94C7B' },
  { jour: 'Mercredi', debut: '08:00', fin: '10:00', titre: 'Anglais', type: 'cours', salle: 'Salle D1', couleur: '#4C7BC9' },
  { jour: 'Mercredi', debut: '10:00', fin: '12:00', titre: 'Culture Littéraire', type: 'cours', salle: 'Salle A2', couleur: '#C97B4C' },
  { jour: 'Jeudi', debut: '09:00', fin: '11:00', titre: 'Culture Scientifique', type: 'cours', salle: 'Labo C1', couleur: '#C94C7B' },
  { jour: 'Jeudi', debut: '14:00', fin: '15:00', titre: 'Réunion parents', type: 'evenement', salle: 'Amphi 1', couleur: '#4C7BC9' },
  { jour: 'Vendredi', debut: '08:00', fin: '10:00', titre: 'Mathématiques', type: 'cours', salle: 'Salle A1', couleur: '#C9A84C' },
  { jour: 'Vendredi', debut: '10:00', fin: '12:00', titre: 'Physique', type: 'cours', salle: 'Labo B2', couleur: '#4CC9A8' },
  { jour: 'Samedi', debut: '08:00', fin: '12:00', titre: 'Session révisions', type: 'evenement', salle: 'Bibliothèque', couleur: '#7B4CC9' },
]

const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

const typeConfig = {
  cours: { label: 'Cours', couleur: '#C9A84C' },
  examen: { label: 'Examen', couleur: '#C94C7B' },
  evenement: { label: 'Événement', couleur: '#4C7BC9' },
}

function getMiniCalendrierDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const start = firstDay === 0 ? 6 : firstDay - 1
  const days = []
  for (let i = 0; i < start; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)
  return days
}

function getHeureIndex(heure) {
  return heures.indexOf(heure)
}

export default function EmploiDuTemps() {
  const today = new Date()
  const [moisActuel, setMoisActuel] = useState(today.getMonth())
  const [anneeActuelle, setAnneeActuelle] = useState(today.getFullYear())
  const [vue, setVue] = useState('semaine')
  const [jourSelectionne, setJourSelectionne] = useState(null)

  const days = getMiniCalendrierDays(anneeActuelle, moisActuel)

  const moisPrecedent = () => {
    if (moisActuel === 0) { setMoisActuel(11); setAnneeActuelle(a => a - 1) }
    else setMoisActuel(m => m - 1)
  }
  const moisSuivant = () => {
    if (moisActuel === 11) { setMoisActuel(0); setAnneeActuelle(a => a + 1) }
    else setMoisActuel(m => m + 1)
  }

  const evenementsFiltres = jourSelectionne
    ? evenements.filter(e => e.jour === jourSelectionne)
    : evenements

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>

      {/* EN-TETE */}
      <div className="mb-6">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>
          Planning
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>
            Emploi du temps
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVue('semaine')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              style={{
                background: vue === 'semaine' ? '#071020' : 'white',
                color: vue === 'semaine' ? '#C9A84C' : '#9ca3af',
                border: '1px solid #f0ece0'
              }}>
              Semaine
            </button>
            <button
              onClick={() => setVue('liste')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              style={{
                background: vue === 'liste' ? '#071020' : 'white',
                color: vue === 'liste' ? '#C9A84C' : '#9ca3af',
                border: '1px solid #f0ece0'
              }}>
              Liste
            </button>
          </div>
        </div>
        <p className="text-gray-400 text-sm mt-1">
          Dernière synchro. le {today.toLocaleDateString('fr-FR')} à {today.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-6">

        {/* COLONNE GAUCHE */}
        <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-4">

          {/* MINI CALENDRIER */}
          <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #f0ece0' }}>
            <div className="flex items-center justify-between mb-4">
              <button onClick={moisPrecedent}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50 transition text-sm">
                &lt;
              </button>
              <p className="text-sm font-bold" style={{ color: '#071020' }}>
                {moisNoms[moisActuel]} {anneeActuelle}
              </p>
              <button onClick={moisSuivant}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50 transition text-sm">
                &gt;
              </button>
            </div>

            <div className="grid grid-cols-7 gap-0.5 mb-2">
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((j, i) => (
                <div key={i} className="text-center text-xs font-semibold text-gray-400 py-1">{j}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {days.map((day, i) => {
                const isToday = day === today.getDate() && moisActuel === today.getMonth() && anneeActuelle === today.getFullYear()
                return (
                  <div key={i}
                    className="text-center text-xs py-1.5 rounded-lg cursor-pointer transition font-medium"
                    style={{
                      background: isToday ? '#071020' : 'transparent',
                      color: isToday ? '#C9A84C' : day ? '#4b5563' : 'transparent',
                      fontWeight: isToday ? 'bold' : 'normal'
                    }}>
                    {day || ''}
                  </div>
                )
              })}
            </div>
          </div>

          {/* TYPES D'EVENEMENTS */}
          <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #f0ece0' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#071020' }}>
              Types d'événements
            </p>
            <div className="flex flex-col gap-2">
              {Object.entries(typeConfig).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: val.couleur }} />
                  <span className="text-xs text-gray-600">{val.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* FILTRER PAR JOUR */}
          <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #f0ece0' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#071020' }}>
              Filtrer par jour
            </p>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setJourSelectionne(null)}
                className="text-left text-xs px-3 py-2 rounded-lg font-semibold transition"
                style={{
                  background: jourSelectionne === null ? 'rgba(201,168,76,0.1)' : 'transparent',
                  color: jourSelectionne === null ? '#C9A84C' : '#6b7280'
                }}>
                Tous les jours
              </button>
              {jours.map(j => (
                <button
                  key={j}
                  onClick={() => setJourSelectionne(j === jourSelectionne ? null : j)}
                  className="text-left text-xs px-3 py-2 rounded-lg transition"
                  style={{
                    background: jourSelectionne === j ? 'rgba(201,168,76,0.1)' : 'transparent',
                    color: jourSelectionne === j ? '#C9A84C' : '#6b7280',
                    fontWeight: jourSelectionne === j ? '600' : '400'
                  }}>
                  {j}
                </button>
              ))}
            </div>
          </div>

          {/* INFORMATIONS */}
          <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #f0ece0' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#071020' }}>
              Informations
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Pour toute question concernant votre planning, veuillez consulter la page
              <span className="font-semibold" style={{ color: '#C9A84C' }}> contacts</span>.
            </p>
          </div>
        </div>

        {/* CALENDRIER PRINCIPAL */}
        <div className="flex-1">

          {vue === 'semaine' ? (
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0ece0' }}>

              {/* En-tete jours */}
              <div className="grid overflow-x-auto" style={{ gridTemplateColumns: '60px repeat(6, 1fr)' }}>
                <div className="p-3 border-b border-r" style={{ borderColor: '#f0ece0' }} />
                {jours.map(j => (
                  <div key={j}
                    className="p-3 text-center border-b border-r text-xs font-bold"
                    style={{
                      borderColor: '#f0ece0',
                      color: jourSelectionne === j ? '#C9A84C' : '#071020',
                      background: jourSelectionne === j ? 'rgba(201,168,76,0.05)' : 'transparent'
                    }}>
                    {j}
                  </div>
                ))}
              </div>

              {/* Grille horaire */}
              <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
                {heures.map((heure, hi) => (
                  <div key={heure}
                    className="grid"
                    style={{ gridTemplateColumns: '60px repeat(6, 1fr)', minHeight: '60px' }}>

                    {/* Heure */}
                    <div className="p-2 border-r border-b text-xs text-gray-400 font-medium flex-shrink-0"
                      style={{ borderColor: '#f0ece0' }}>
                      {heure}
                    </div>

                    {/* Cellules par jour */}
                    {jours.map(jour => {
                      const ev = evenements.find(e =>
                        e.jour === jour && e.debut === heure
                      )
                      return (
                        <div key={jour}
                          className="border-r border-b relative"
                          style={{ borderColor: '#f0ece0', minHeight: '60px' }}>
                          {ev && (
                            <div
                              className="absolute inset-x-1 top-1 rounded-lg p-2 cursor-pointer"
                              style={{
                                background: `${ev.couleur}15`,
                                border: `1px solid ${ev.couleur}40`,
                                minHeight: `${(getHeureIndex(ev.fin) - getHeureIndex(ev.debut)) * 60 - 8}px`,
                                zIndex: 10
                              }}>
                              <p className="text-xs font-bold leading-tight" style={{ color: ev.couleur }}>
                                {ev.titre}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">{ev.debut} - {ev.fin}</p>
                              <p className="text-xs text-gray-400">{ev.salle}</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

          ) : (
            // VUE LISTE
            <div className="flex flex-col gap-3">
              {jours.map(jour => {
                const evJour = evenementsFiltres.filter(e => e.jour === jour)
                if (evJour.length === 0) return null
                return (
                  <div key={jour} className="bg-white rounded-2xl p-4"
                    style={{ border: '1px solid #f0ece0' }}>
                    <p className="text-sm font-bold mb-3" style={{ color: '#071020' }}>{jour}</p>
                    <div className="flex flex-col gap-2">
                      {evJour.map((ev, i) => (
                        <div key={i}
                          className="flex items-center gap-3 p-3 rounded-xl"
                          style={{
                            background: `${ev.couleur}08`,
                            border: `1px solid ${ev.couleur}25`
                          }}>
                          <div className="w-1 h-10 rounded-full flex-shrink-0"
                            style={{ background: ev.couleur }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-800">{ev.titre}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{ev.debut} - {ev.fin} — {ev.salle}</p>
                          </div>
                          <span className="text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                            style={{ background: `${ev.couleur}15`, color: ev.couleur }}>
                            {typeConfig[ev.type].label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}