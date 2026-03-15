import { useState } from 'react'

const ecoles = [
  {
    sigle: 'INP-HB',
    nom: 'Institut National Polytechnique Houphouët-Boigny',
    logo: 'https://inphb.edu.ci/wp-content/uploads/2020/03/INPHB.png',
    couleur: '#C9A84C',
    matieres: [
      {
        code: 'CG-INP',
        nom: 'Culture Générale',
        couleur: '#7B4CC9',
        description: 'Préparation à l\'épreuve de culture générale du concours INP-HB',
        modules: ['Histoire et Géographie', 'Actualités mondiales', 'Philosophie', 'Institutions ivoiriennes'],
      },
      {
        code: 'CS-INP',
        nom: 'Culture Scientifique',
        couleur: '#4CC9A8',
        description: 'Renforcement des bases scientifiques pour le concours INP-HB',
        modules: ['Biologie', 'Chimie générale', 'Sciences de la vie', 'Environnement'],
      },
      {
        code: 'CL-INP',
        nom: 'Culture Littéraire',
        couleur: '#C97B4C',
        description: 'Maîtrise de la langue française et expression écrite',
        modules: ['Dissertation', 'Résumé de texte', 'Commentaire littéraire', 'Expression écrite'],
      },
    ],
  },
  {
    sigle: 'ESATIC',
    nom: 'École Supérieure Africaine des TIC',
    logo: 'https://esatic.ci/wp-content/uploads/2024/07/esatic_logo.jpg',
    couleur: '#4C7BC9',
    matieres: [
      {
        code: 'MATH-ES',
        nom: 'Mathématiques',
        couleur: '#C9A84C',
        description: 'Algèbre, analyse et probabilités pour le concours ESATIC',
        modules: ['Algèbre linéaire', 'Analyse', 'Probabilités', 'Statistiques'],
      },
      {
        code: 'PHY-ES',
        nom: 'Physique',
        couleur: '#4CC9A8',
        description: 'Mécanique, électricité et optique pour le concours ESATIC',
        modules: ['Mécanique', 'Électricité', 'Optique', 'Thermodynamique'],
      },
      {
        code: 'ANG-ES',
        nom: 'Anglais',
        couleur: '#C94C7B',
        description: 'Compréhension et expression en anglais technique',
        modules: ['Compréhension écrite', 'Expression écrite', 'Anglais technique', 'Vocabulaire'],
      },
      {
        code: 'FR-ES',
        nom: 'Français',
        couleur: '#4C7BC9',
        description: 'Maîtrise de la langue française pour le concours ESATIC',
        modules: ['Grammaire', 'Orthographe', 'Expression écrite', 'Résumé de texte'],
      },
    ],
  },
]

export default function Ressources() {
  const [ecoleSelectionnee, setEcoleSelectionnee] = useState(null)
  const [matiereSelectionnee, setMatiereSelectionnee] = useState(null)

  const ecoleActive = ecoles.find(e => e.sigle === ecoleSelectionnee)
  const matiereActive = ecoleActive?.matieres.find(m => m.code === matiereSelectionnee)

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>

      {/* EN-TETE */}
      <div className="mb-6 md:mb-8">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>
          Ressources
        </p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>
          {!ecoleActive && 'Centre de ressources'}
          {ecoleActive && !matiereActive && ecoleActive.sigle}
          {matiereActive && matiereActive.nom}
        </h1>

        {/* Fil d'ariane */}
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 flex-wrap">
          <button
            onClick={() => { setEcoleSelectionnee(null); setMatiereSelectionnee(null) }}
            className="hover:underline"
            style={{ color: ecoleActive ? '#C9A84C' : '#9ca3af' }}>
            Ressources
          </button>
          {ecoleActive && (
            <>
              <span>/</span>
              <button
                onClick={() => setMatiereSelectionnee(null)}
                className="hover:underline"
                style={{ color: matiereActive ? '#C9A84C' : '#9ca3af' }}>
                {ecoleActive.sigle}
              </button>
            </>
          )}
          {matiereActive && (
            <>
              <span>/</span>
              <span className="text-gray-600">{matiereActive.nom}</span>
            </>
          )}
        </div>
      </div>

      {/* NIVEAU 1 — Choix de l'école */}
      {!ecoleSelectionnee && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ecoles.map((ecole, i) => (
            <div
              key={i}
              onClick={() => setEcoleSelectionnee(ecole.sigle)}
              className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #071020, #0d1f3c)',
                border: `2px solid ${ecole.couleur}40`,
                transform: 'scale(1)',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>

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

              <div className="h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${ecole.couleur}, transparent)` }} />

              <div className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-sm">{ecole.sigle}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{ecole.matieres.length} matières disponibles</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-lg"
                  style={{ background: `${ecole.couleur}20`, color: ecole.couleur }}>
                  Accéder
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NIVEAU 2 — Choix de la matière */}
      {ecoleActive && !matiereActive && (
        <div>
          <button
            onClick={() => setEcoleSelectionnee(null)}
            className="flex items-center gap-2 mb-6 text-xs font-semibold"
            style={{ color: '#C9A84C' }}>
            &lt; Retour aux concours
          </button>

          {/* Header école */}
          <div className="rounded-2xl overflow-hidden mb-6"
            style={{ border: '1px solid #f0ece0' }}>
            <div className="flex items-center gap-4 p-5"
              style={{
                background: 'linear-gradient(135deg, #071020, #0d1f3c)',
                borderBottom: `2px solid ${ecoleActive.couleur}`
              }}>
              <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center p-1.5 flex-shrink-0">
                <img
                  src={ecoleActive.logo}
                  alt={ecoleActive.sigle}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.parentNode.innerHTML = `<span style="font-weight:bold;color:#C9A84C;font-size:12px">${ecoleActive.sigle}</span>`
                  }}
                />
              </div>
              <div>
                <p className="text-white font-bold text-lg">{ecoleActive.sigle}</p>
                <p className="text-xs text-gray-400 mt-0.5">{ecoleActive.nom}</p>
              </div>
            </div>
          </div>

          {/* Grille matières */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ecoleActive.matieres.map((matiere, i) => (
              <div
                key={i}
                onClick={() => setMatiereSelectionnee(matiere.code)}
                className="bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg"
                style={{ border: '1px solid #f0ece0' }}>

                {/* Bande colorée */}
                <div className="h-2" style={{ background: matiere.couleur }} />

                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${matiere.couleur}15` }}>
                      <div className="w-3 h-3 rounded-full" style={{ background: matiere.couleur }} />
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: '#071020' }}>{matiere.nom}</p>
                      <p className="text-xs text-gray-400">{matiere.code}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">{matiere.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{matiere.modules.length} modules</span>
                    <span className="text-xs font-semibold px-2 py-1 rounded-lg"
                      style={{ background: `${matiere.couleur}15`, color: matiere.couleur }}>
                      Ouvrir
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NIVEAU 3 — Page de la matière */}
      {matiereActive && (
        <div>
          <button
            onClick={() => setMatiereSelectionnee(null)}
            className="flex items-center gap-2 mb-6 text-xs font-semibold"
            style={{ color: '#C9A84C' }}>
            &lt; Retour aux matières
          </button>

          {/* Header matière */}
          <div className="rounded-2xl overflow-hidden mb-6"
            style={{ border: '1px solid #f0ece0' }}>
            <div className="p-6"
              style={{
                background: 'linear-gradient(135deg, #071020, #0d1f3c)',
                borderBottom: `2px solid ${matiereActive.couleur}`
              }}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${matiereActive.couleur}20`, border: `1px solid ${matiereActive.couleur}40` }}>
                  <div className="w-4 h-4 rounded-full" style={{ background: matiereActive.couleur }} />
                </div>
                <div>
                  <p className="font-bold text-xl text-white">{matiereActive.nom}</p>
                  <p className="text-xs mt-1" style={{ color: matiereActive.couleur }}>{matiereActive.code} — {ecoleActive.sigle}</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm mt-4">{matiereActive.description}</p>
            </div>

            {/* Onglets */}
            <div className="flex border-b bg-white" style={{ borderColor: '#f0ece0' }}>
              {['Cours', 'Participants', 'Notes'].map((onglet, i) => (
                <button key={i}
                  className="px-6 py-3 text-sm font-semibold transition"
                  style={{
                    color: i === 0 ? matiereActive.couleur : '#9ca3af',
                    borderBottom: i === 0 ? `2px solid ${matiereActive.couleur}` : '2px solid transparent'
                  }}>
                  {onglet}
                </button>
              ))}
            </div>
          </div>

          {/* Modules */}
          <div className="bg-white rounded-2xl p-6"
            style={{ border: '1px solid #f0ece0' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base" style={{ color: '#071020' }}>Généralités</h2>
              <button className="text-xs font-semibold" style={{ color: '#C9A84C' }}>
                Tout replier
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {matiereActive.modules.map((module, i) => (
                <div key={i}
                  className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition hover:shadow-md"
                  style={{
                    background: `${matiereActive.couleur}06`,
                    border: `1px solid ${matiereActive.couleur}20`
                  }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${matiereActive.couleur}15` }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: matiereActive.couleur }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: '#071020' }}>{module}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Module {i + 1} — Contenu disponible</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                    style={{ background: `${matiereActive.couleur}15`, color: matiereActive.couleur }}>
                    Accéder
                  </span>
                </div>
              ))}
            </div>

            {/* Annonces */}
            <div className="mt-6 pt-5" style={{ borderTop: '1px solid #f0ece0' }}>
              <div className="flex items-center gap-3 p-4 rounded-xl"
                style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(7,16,32,0.9)' }}>
                  <span className="text-sm" style={{ color: '#C9A84C' }}>A</span>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#071020' }}>Annonces</p>
                  <p className="text-xs text-gray-400 mt-0.5">Aucune annonce pour le moment</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}