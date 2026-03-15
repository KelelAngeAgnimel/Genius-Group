import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const matieres = [
  { nom: 'Mathématiques', note: 14, icon: '📐', couleur: '#C9A84C' },
  { nom: 'Anglais', note: 15, icon: '🌍', couleur: '#4C7BC9' },
  { nom: 'Physique', note: 14, icon: '⚗️', couleur: '#4CC9A8' },
  { nom: 'Culture Scientifique', note: 14, icon: '🔬', couleur: '#C94C7B' },
  { nom: 'Culture Générale', note: 15, icon: '📚', couleur: '#7B4CC9' },
  { nom: 'Culture Littéraire', note: 13, icon: '✍️', couleur: '#C97B4C' },
]

const evenements = [
  { date: 'Lun 16 Mar', heure: '08h00', titre: 'Cours Mathématiques', type: 'cours', couleur: '#C9A84C' },
  { date: 'Lun 16 Mar', heure: '10h00', titre: 'Cours Anglais', type: 'cours', couleur: '#4C7BC9' },
  { date: 'Mar 17 Mar', heure: '08h00', titre: 'Concours Blanc', type: 'concours', couleur: '#C94C7B' },
  { date: 'Mer 18 Mar', heure: '14h00', titre: 'Culture Générale', type: 'cours', couleur: '#7B4CC9' },
  { date: 'Jeu 19 Mar', heure: '09h00', titre: 'Réunion parents', type: 'reunion', couleur: '#4CC9A8' },
]

const messages = [
  { de: 'M. Konan', matiere: 'Mathématiques', message: 'Exercices supplémentaires sur les suites', heure: 'Il y a 2h', lu: false },
  { de: 'Mme Diallo', matiere: 'Culture Générale', message: 'Fiche de révision à télécharger', heure: 'Hier', lu: false },
  { de: 'M. Bamba', matiere: 'Physique', message: 'Correction du devoir de la semaine dernière', heure: 'Il y a 2j', lu: true },
]

const concours = [
  { nom: 'CPGE', echeance: '45 jours', progression: 68, couleur: '#C9A84C' },
  { nom: 'Écoles de Commerce', echeance: '60 jours', progression: 55, couleur: '#4C7BC9' },
  { nom: 'Grandes Écoles', echeance: '90 jours', progression: 42, couleur: '#4CC9A8' },
]

export default function Actualites() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const moyenneGenerale = (matieres.reduce((a, m) => a + m.note, 0) / matieres.length).toFixed(1)

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>

      {/* EN-TÊTE */}
      <div className="mb-6 md:mb-8">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>
          Bienvenue
        </p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>
          Bonjour, {user?.prenom || user?.username} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Voici un résumé de votre espace personnel</p>
      </div>

      {/* CARTES RÉSUMÉ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">

        <div className="rounded-2xl p-4 md:p-5 col-span-2 md:col-span-1"
          style={{
            background: 'linear-gradient(135deg, #071020, #0d1f3c)',
            border: '1px solid rgba(201,168,76,0.3)',
            boxShadow: '0 4px 24px rgba(201,168,76,0.1)'
          }}>
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'rgba(201,168,76,0.7)' }}>
            Moyenne Générale
          </p>
          <p className="text-4xl md:text-5xl font-bold" style={{ color: '#C9A84C' }}>{moyenneGenerale}</p>
          <p className="text-gray-400 text-xs mt-1">/20 — Mars 2026</p>
          <div className="mt-2 flex items-center gap-1">
            <span className="text-green-400 text-xs font-semibold">↑ +1.2</span>
            <span className="text-gray-500 text-xs">vs mois dernier</span>
          </div>
        </div>

        <div className="rounded-2xl p-4 md:p-5 bg-white"
          style={{ border: '1px solid #f0ece0' }}>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Messages</p>
          <p className="text-3xl md:text-4xl font-bold" style={{ color: '#071020' }}>
            {messages.filter(m => !m.lu).length}
          </p>
          <p className="text-gray-500 text-xs mt-1">non lus</p>
          <p className="text-xs mt-2 font-semibold" style={{ color: '#C9A84C' }}>📬 Voir tout</p>
        </div>

        <div className="rounded-2xl p-4 md:p-5 bg-white"
          style={{ border: '1px solid #f0ece0' }}>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Prochain cours</p>
          <p className="text-sm font-bold" style={{ color: '#071020' }}>Mathématiques</p>
          <p className="text-gray-500 text-xs mt-1">Lun 16 Mar</p>
          <p className="text-xs mt-2 font-semibold" style={{ color: '#4C7BC9' }}>🕗 08h00</p>
        </div>

        <div className="rounded-2xl p-4 md:p-5 bg-white"
          style={{ border: '1px solid #f0ece0' }}>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Concours</p>
          <p className="text-3xl md:text-4xl font-bold" style={{ color: '#071020' }}>45</p>
          <p className="text-gray-500 text-xs mt-1">jours restants</p>
          <p className="text-xs mt-2 font-semibold" style={{ color: '#C94C7B' }}>🏆 CPGE</p>
        </div>
      </div>

      {/* GRILLE PRINCIPALE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6">

        {/* PROGRESSION PAR MATIÈRE */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5"
          style={{ border: '1px solid #f0ece0' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-base md:text-lg" style={{ color: '#071020' }}>
              📊 Progression par matière
            </h2>
            <button
              onClick={() => navigate('/accueil/statistiques')}
              className="text-xs font-semibold"
              style={{ color: '#C9A84C' }}>
              Voir détails →
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {matieres.map(m => (
              <div key={m.nom}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs md:text-sm font-medium text-gray-700">
                    {m.icon} {m.nom}
                  </span>
                  <span className="text-xs md:text-sm font-bold" style={{ color: m.couleur }}>
                    {m.note}/20
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-gray-100">
                  <div
                    className="h-2.5 rounded-full transition-all duration-700"
                    style={{
                      width: `${(m.note / 20) * 100}%`,
                      background: `linear-gradient(90deg, ${m.couleur}88, ${m.couleur})`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* EMPLOI DU TEMPS */}
        <div className="bg-white rounded-2xl p-5"
          style={{ border: '1px solid #f0ece0' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-base md:text-lg" style={{ color: '#071020' }}>
              📅 Planning
            </h2>
            <button
              onClick={() => navigate('/planning/emploi-du-temps')}
              className="text-xs font-semibold"
              style={{ color: '#C9A84C' }}>
              Voir tout →
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {evenements.map((ev, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: ev.couleur }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate">{ev.titre}</p>
                  <p className="text-xs text-gray-400">{ev.date} — {ev.heure}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GRILLE SECONDAIRE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

        {/* BOÎTE DE RÉCEPTION */}
        <div className="bg-white rounded-2xl p-5"
          style={{ border: '1px solid #f0ece0' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-base md:text-lg" style={{ color: '#071020' }}>
              📬 Boîte de réception
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}>
              {messages.filter(m => !m.lu).length} nouveau{messages.filter(m => !m.lu).length > 1 ? 'x' : ''}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div key={i}
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: msg.lu ? '#fafafa' : 'rgba(201,168,76,0.05)', border: `1px solid ${msg.lu ? '#f0ece0' : 'rgba(201,168,76,0.2)'}` }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                  style={{ background: '#071020' }}>
                  {msg.de.split(' ')[1]?.[0] || msg.de[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-gray-800 truncate">{msg.de}</p>
                    <p className="text-xs text-gray-400 flex-shrink-0">{msg.heure}</p>
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

        {/* ESPACE CONCOURS */}
        <div className="bg-white rounded-2xl p-5"
          style={{ border: '1px solid #f0ece0' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-base md:text-lg" style={{ color: '#071020' }}>
              🏆 Espace Concours
            </h2>
            <button className="text-xs font-semibold" style={{ color: '#C9A84C' }}>
              Voir tout →
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {concours.map((c, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-gray-800">🎯 {c.nom}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${c.couleur}15`, color: c.couleur }}>
                    {c.echeance}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2.5 rounded-full bg-gray-100">
                    <div
                      className="h-2.5 rounded-full"
                      style={{
                        width: `${c.progression}%`,
                        background: `linear-gradient(90deg, ${c.couleur}88, ${c.couleur})`
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold" style={{ color: c.couleur }}>
                    {c.progression}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Points forts / faibles */}
          <div className="mt-5 pt-4" style={{ borderTop: '1px solid #f0ece0' }}>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Points forts</p>
            <div className="flex flex-wrap gap-2">
              {matieres.filter(m => m.note >= 14).map(m => (
                <span key={m.nom} className="text-xs px-2 py-1 rounded-lg font-semibold"
                  style={{ background: `${m.couleur}15`, color: m.couleur }}>
                  {m.icon} {m.nom}
                </span>
              ))}
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 mt-4">À renforcer</p>
            <div className="flex flex-wrap gap-2">
              {matieres.filter(m => m.note < 14).map(m => (
                <span key={m.nom} className="text-xs px-2 py-1 rounded-lg font-semibold bg-red-50 text-red-400">
                  {m.icon} {m.nom}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}