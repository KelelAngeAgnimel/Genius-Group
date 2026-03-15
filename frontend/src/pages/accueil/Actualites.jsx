import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const ecoles = [
  {
    sigle: 'INP-HB',
    nom: 'Institut National Polytechnique Houphouët-Boigny',
    logo: 'https://inphb.ci/wp-content/uploads/2021/03/logo-inphb.png',
    description: 'Grande école d\'ingénieurs et de management de Côte d\'Ivoire',
    moyenne: 14.0,
    matieres: [
      { nom: 'Culture Scientifique', note: 14, couleur: '#C9A84C' },
      { nom: 'Culture Générale', note: 15, couleur: '#7B4CC9' },
      { nom: 'Culture Littéraire', note: 13, couleur: '#C97B4C' },
    ],
    couleur: '#C9A84C',
    site: 'https://inphb.ci'
  },
  {
    sigle: 'ESATIC',
    nom: 'École Supérieure Africaine des TIC',
    logo: 'https://esatic.ci/wp-content/uploads/2024/07/esatic_logo.jpg',
    description: 'Établissement d\'excellence dédié aux technologies de l\'information',
    moyenne: 13.8,
    matieres: [
      { nom: 'Mathématiques', note: 14, couleur: '#4C7BC9' },
      { nom: 'Physique', note: 14, couleur: '#4CC9A8' },
      { nom: 'Anglais', note: 15, couleur: '#C94C7B' },
    ],
    couleur: '#4C7BC9',
    site: 'https://esatic.ci'
  },
]

const evenements = [
  { date: 'Lun 16 Mar', heure: '08h00', titre: 'Cours Mathématiques', couleur: '#C9A84C' },
  { date: 'Lun 16 Mar', heure: '10h00', titre: 'Cours Anglais', couleur: '#4C7BC9' },
  { date: 'Mar 17 Mar', heure: '08h00', titre: 'Concours Blanc', couleur: '#C94C7B' },
  { date: 'Mer 18 Mar', heure: '14h00', titre: 'Culture Générale', couleur: '#7B4CC9' },
  { date: 'Jeu 19 Mar', heure: '09h00', titre: 'Réunion parents', couleur: '#4CC9A8' },
]

const messages = [
  { de: 'M. Konan', matiere: 'Mathématiques', message: 'Exercices supplémentaires sur les suites', heure: 'Il y a 2h', lu: false },
  { de: 'Mme Diallo', matiere: 'Culture Générale', message: 'Fiche de révision à télécharger', heure: 'Hier', lu: false },
  { de: 'M. Bamba', matiere: 'Physique', message: 'Correction du devoir de la semaine dernière', heure: 'Il y a 2j', lu: true },
]

export default function Actualites() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>

      {/* EN-TÊTE */}
      <div className="mb-6 md:mb-8">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>
          Tableau de bord
        </p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>
          Bonjour, {user?.prenom || user?.username}
        </h1>
        <p className="text-gray-400 text-sm mt-1">Mars 2026 — Voici votre résumé du jour</p>
      </div>

      {/* CARTES RÉSUMÉ */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">

        <div className="rounded-2xl p-4 md:p-5"
          style={{
            background: 'linear-gradient(135deg, #071020, #0d1f3c)',
            border: '1px solid rgba(201,168,76,0.3)',
          }}>
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'rgba(201,168,76,0.7)' }}>
            Messages non lus
          </p>
          <p className="text-4xl font-bold" style={{ color: '#C9A84C' }}>
            {messages.filter(m => !m.lu).length}
          </p>
          <p className="text-gray-400 text-xs mt-1">nouveaux messages</p>
        </div>

        <div className="rounded-2xl p-4 md:p-5 bg-white"
          style={{ border: '1px solid #f0ece0' }}>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Prochain cours</p>
          <p className="text-sm font-bold" style={{ color: '#071020' }}>Mathématiques</p>
          <p className="text-gray-400 text-xs mt-1">Lun 16 Mar — 08h00</p>
        </div>

        <div className="rounded-2xl p-4 md:p-5 bg-white col-span-2 md:col-span-1"
          style={{ border: '1px solid #f0ece0' }}>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Prochain concours</p>
          <p className="text-sm font-bold" style={{ color: '#071020' }}>Concours CPGE</p>
          <p className="text-xs mt-1 font-semibold" style={{ color: '#C94C7B' }}>45 jours restants</p>
        </div>
      </div>

      {/* ESPACES DE PRÉPARATION */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-base md:text-lg" style={{ color: '#071020' }}>
            Vos espaces de préparation
          </h2>
          <button
            onClick={() => navigate('/accueil/statistiques')}
            className="text-xs font-semibold"
            style={{ color: '#C9A84C' }}>
            Voir statistiques →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {ecoles.map((ecole, i) => (
            <div key={i}
              className="bg-white rounded-2xl overflow-hidden"
              style={{ border: '1px solid #f0ece0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>

              {/* Header école */}
              <div className="p-5 flex items-center gap-4"
                style={{
                  background: 'linear-gradient(135deg, #071020, #0d1f3c)',
                  borderBottom: `2px solid ${ecole.couleur}`
                }}>
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white flex items-center justify-center flex-shrink-0 p-1">
                  <img
                    src={ecole.logo}
                    alt={ecole.sigle}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.parentNode.innerHTML = `<span style="font-weight:bold;color:#C9A84C;font-size:14px">${ecole.sigle}</span>`
                    }}
                  />
                </div>
                <div>
                  <p className="font-bold text-white text-lg">{ecole.sigle}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-tight">{ecole.nom}</p>
                  <p className="text-xs mt-1" style={{ color: ecole.couleur }}>{ecole.description}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-3xl font-bold" style={{ color: ecole.couleur }}>{ecole.moyenne}</p>
                  <p className="text-xs text-gray-400">/20 moy.</p>
                </div>
              </div>

              {/* Matières */}
              <div className="p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Progression par matière
                </p>
                <div className="flex flex-col gap-3">
                  {ecole.matieres.map((m, j) => (
                    <div key={j}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">{m.nom}</span>
                        <span className="text-xs font-bold" style={{ color: m.couleur }}>{m.note}/20</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${(m.note / 20) * 100}%`,
                            background: `linear-gradient(90deg, ${m.couleur}66, ${m.couleur})`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <a href={ecole.site} target="_blank" rel="noopener noreferrer"
                  className="block mt-4 text-center text-xs font-semibold py-2 rounded-lg transition"
                  style={{
                    border: `1px solid ${ecole.couleur}40`,
                    color: ecole.couleur
                  }}>
                  Visiter le site officiel
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GRILLE PLANNING + MESSAGES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

        {/* PLANNING */}
        <div className="bg-white rounded-2xl p-5"
          style={{ border: '1px solid #f0ece0' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base" style={{ color: '#071020' }}>Planning de la semaine</h2>
            <button
              onClick={() => navigate('/planning/emploi-du-temps')}
              className="text-xs font-semibold"
              style={{ color: '#C9A84C' }}>
              Voir tout →
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {evenements.map((ev, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg"
                style={{ background: `${ev.couleur}08` }}>
                <div className="w-1 h-8 rounded-full flex-shrink-0"
                  style={{ background: ev.couleur }} />
                <div>
                  <p className="text-xs font-semibold text-gray-800">{ev.titre}</p>
                  <p className="text-xs text-gray-400">{ev.date} — {ev.heure}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOITE DE RÉCEPTION */}
        <div className="bg-white rounded-2xl p-5"
          style={{ border: '1px solid #f0ece0' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base" style={{ color: '#071020' }}>Boîte de réception</h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}>
              {messages.filter(m => !m.lu).length} nouveau{messages.filter(m => !m.lu).length > 1 ? 'x' : ''}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div key={i}
                className="flex items-start gap-3 p-3 rounded-xl cursor-pointer"
                style={{
                  background: msg.lu ? '#fafafa' : 'rgba(201,168,76,0.04)',
                  border: `1px solid ${msg.lu ? '#f0ece0' : 'rgba(201,168,76,0.15)'}`
                }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                  style={{ background: '#0d1f3c' }}>
                  {msg.de.split(' ')[1]?.[0] || msg.de[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-800 truncate">{msg.de}</p>
                    <p className="text-xs text-gray-400 flex-shrink-0 ml-2">{msg.heure}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{msg.message}</p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: '#C9A84C' }}>{msg.matiere}</p>
                </div>
                {!msg.lu && (
                  <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                    style={{ background: '#C9A84C' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}