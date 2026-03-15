import { useState } from 'react'

const ecoles = [
  {
    sigle: 'INP-HB',
    nom: 'Institut National Polytechnique Houphouët-Boigny',
    logo: 'https://inphb.edu.ci/wp-content/uploads/2020/03/INPHB.png',
    couleur: '#C9A84C',
    site: 'https://inphb.ci',
    matieres: [
      { nom: 'Culture Scientifique', progression: 68, couleur: '#4CC9A8' },
      { nom: 'Culture Générale', progression: 75, couleur: '#7B4CC9' },
      { nom: 'Culture Littéraire', progression: 65, couleur: '#C97B4C' },
    ],
  },
  {
    sigle: 'ESATIC',
    nom: 'École Supérieure Africaine des TIC',
    logo: 'https://esatic.ci/wp-content/uploads/2024/07/esatic_logo.jpg',
    couleur: '#4C7BC9',
    site: 'https://esatic.ci',
    matieres: [
      { nom: 'Mathématiques', progression: 70, couleur: '#C9A84C' },
      { nom: 'Physique', progression: 70, couleur: '#4CC9A8' },
      { nom: 'Anglais', progression: 75, couleur: '#C94C7B' },
      { nom: 'Français', progression: 60, couleur: '#4C7BC9' },
    ],
  },
]

export default function SuiviProgression() {
  const [ecoleSelectionnee, setEcoleSelectionnee] = useState(null)
  const ecoleActive = ecoles.find(e => e.sigle === ecoleSelectionnee)

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>

      {/* EN-TETE */}
      <div className="mb-6 md:mb-8">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>
          Planning
        </p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>
          Suivi de progression
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Sélectionnez un concours pour voir votre progression
        </p>
      </div>

      {/* VUE CARTES */}
      {!ecoleSelectionnee && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ecoles.map((ecole, i) => (
            <div
              key={i}
              onClick={() => setEcoleSelectionnee(ecole.sigle)}
              className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-2xl hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #071020, #0d1f3c)',
                border: `2px solid ${ecole.couleur}40`,
                boxShadow: `0 4px 24px rgba(0,0,0,0.15)`
              }}>

              {/* Zone logo */}
              <div className="flex items-center justify-center py-16 px-8">
                <img
                  src={ecole.logo}
                  alt={ecole.sigle}
                  className="object-contain"
                  style={{ maxHeight: '140px', maxWidth: '260px' }}
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.parentNode.innerHTML = `<span style="font-size:52px;font-weight:bold;color:#C9A84C;letter-spacing:0.1em">${ecole.sigle}</span>`
                  }}
                />
              </div>

              {/* Barre dorée en bas */}
              <div className="h-1" style={{ background: `linear-gradient(90deg, transparent, ${ecole.couleur}, transparent)` }} />

              {/* Nom en bas */}
              <div className="px-6 py-4 text-center">
                <p className="text-xs text-gray-400 tracking-widest">{ecole.nom}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VUE DETAIL */}
      {ecoleActive && (
        <div>
          {/* Bouton retour */}
          <button
            onClick={() => setEcoleSelectionnee(null)}
            className="flex items-center gap-2 mb-6 text-xs font-semibold"
            style={{ color: '#C9A84C' }}>
            &lt; Retour aux concours
          </button>

          {/* Header école */}
          <div className="rounded-2xl overflow-hidden mb-6"
            style={{ border: '1px solid #f0ece0' }}>
            <div className="flex flex-col sm:flex-row items-center gap-5 p-6"
              style={{
                background: 'linear-gradient(135deg, #071020, #0d1f3c)',
                borderBottom: `2px solid ${ecoleActive.couleur}`
              }}>
              <div className="w-24 h-24 rounded-xl bg-white flex items-center justify-center p-2 flex-shrink-0">
                <img
                  src={ecoleActive.logo}
                  alt={ecoleActive.sigle}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.parentNode.innerHTML = `<span style="font-weight:bold;color:#C9A84C;font-size:14px">${ecoleActive.sigle}</span>`
                  }}
                />
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-bold text-white">{ecoleActive.sigle}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{ecoleActive.nom}</p>
                <a href={ecoleActive.site} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-semibold mt-2 inline-block"
                  style={{ color: ecoleActive.couleur }}>
                  Visiter le site officiel
                </a>
              </div>
              <div className="sm:ml-auto text-center">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Progression globale</p>
                <p className="text-5xl font-bold" style={{ color: ecoleActive.couleur }}>
                  {Math.round(ecoleActive.matieres.reduce((a, m) => a + m.progression, 0) / ecoleActive.matieres.length)}%
                </p>
              </div>
            </div>
          </div>

          {/* Progression détaillée */}
          <div className="bg-white rounded-2xl p-6"
            style={{ border: '1px solid #f0ece0' }}>
            <h3 className="font-bold text-base mb-6" style={{ color: '#071020' }}>
              Progression par matière
            </h3>
            <div className="flex flex-col gap-6">
              {ecoleActive.matieres.map((m, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">{m.nom}</span>
                    <span className="text-sm font-bold" style={{ color: m.couleur }}>{m.progression}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-gray-100">
                    <div
                      className="h-3 rounded-full transition-all duration-700"
                      style={{
                        width: `${m.progression}%`,
                        background: `linear-gradient(90deg, ${m.couleur}66, ${m.couleur})`
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-400">Débutant</span>
                    <span className="text-xs text-gray-400">Expert</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}