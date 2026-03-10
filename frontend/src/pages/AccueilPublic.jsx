import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const actualites = [
  {
    id: 1,
    type: 'Webinaire',
    titre: 'Stratégies pour réussir le concours BCPST',
    date: '15 Mars 2026',
    description: 'Rejoignez nos experts pour une session de préparation intensive aux concours des classes préparatoires.',
    couleur: '#C9A84C',
    icon: '🎯'
  },
  {
    id: 2,
    type: 'Portes Ouvertes',
    titre: 'Journée Portes Ouvertes — Genius Group',
    date: '22 Mars 2026',
    description: 'Venez découvrir nos locaux, rencontrer nos professeurs et en savoir plus sur La Méthode Genius.',
    couleur: '#4C7BC9',
    icon: '🏫'
  },
  {
    id: 3,
    type: 'Annonce',
    titre: 'Résultats du concours blanc de Février',
    date: '10 Mars 2026',
    description: 'Les résultats du dernier concours blanc sont disponibles. Connectez-vous pour consulter vos notes.',
    couleur: '#4CC9A8',
    icon: '📊'
  },
  {
    id: 4,
    type: 'Webinaire',
    titre: 'Orientation post-bac : choisir sa prépa',
    date: '28 Mars 2026',
    description: 'Nos conseillers vous guident dans le choix de votre filière et vous présentent les débouchés.',
    couleur: '#C94C7B',
    icon: '🧭'
  },
]

const concours = [
  { nom: 'Concours CPGE', icon: '🏆', desc: 'Classes Préparatoires aux Grandes Écoles' },
  { nom: 'Écoles de Commerce', icon: '📈', desc: 'HEC, ESSEC, EDHEC et plus' },
  { nom: 'Écoles d\'Ingénieurs', icon: '⚙️', desc: 'Polytechnique, Centrale, Mines' },
  { nom: 'Concours Médecine', icon: '🩺', desc: 'PASS, LAS et passerelles' },
  { nom: 'Grandes Écoles', icon: '🎓', desc: 'ENS, Sciences Po, ENA' },
  { nom: 'Concours Internationaux', icon: '🌍', desc: 'Universités étrangères' },
]

const evenements = [
  { date: '15 Mar', titre: 'Webinaire BCPST', heure: '18h00', type: 'webinaire' },
  { date: '18 Mar', titre: 'Réunion parents', heure: '17h30', type: 'reunion' },
  { date: '22 Mar', titre: 'Portes Ouvertes', heure: '09h00', type: 'evenement' },
  { date: '25 Mar', titre: 'Concours blanc', heure: '08h00', type: 'concours' },
  { date: '28 Mar', titre: 'Webinaire orientation', heure: '18h00', type: 'webinaire' },
]

const couleurType = {
  webinaire: '#C9A84C',
  reunion: '#4C7BC9',
  evenement: '#4CC9A8',
  concours: '#C94C7B',
}

export default function AccueilPublic() {
  const navigate = useNavigate()
  const [menuOuvert, setMenuOuvert] = useState(false)

  return (
    <div className="min-h-screen" style={{ background: '#f8f7f4' }}>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 shadow-md"
        style={{ background: '#071020', borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧠</span>
            <div>
              <p className="font-bold tracking-widest text-sm" style={{ color: '#C9A84C' }}>GENIUS GROUP</p>
              <p className="text-xs tracking-widest" style={{ color: 'rgba(201,168,76,0.5)' }}>LA MÉTHODE GENIUS</p>
            </div>
          </div>

          {/* Menu desktop */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#actualites" className="text-gray-400 hover:text-white text-sm transition">Actualités</a>
            <a href="#planning" className="text-gray-400 hover:text-white text-sm transition">Planning</a>
            <a href="#concours" className="text-gray-400 hover:text-white text-sm transition">Concours</a>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition"
              style={{
                background: 'linear-gradient(135deg, #C9A84C, #8B6914)',
                color: '#071020'
              }}>
              Se connecter
            </button>
          </div>

          {/* Menu burger mobile */}
          <button
            className="md:hidden text-white text-2xl"
            onClick={() => setMenuOuvert(!menuOuvert)}>
            {menuOuvert ? '✕' : '☰'}
          </button>
        </div>

        {/* Menu mobile déroulant */}
        {menuOuvert && (
          <div className="md:hidden px-4 pb-4 flex flex-col gap-3"
            style={{ background: '#071020' }}>
            <a href="#actualites" className="text-gray-400 text-sm py-2 border-b border-gray-800" onClick={() => setMenuOuvert(false)}>Actualités</a>
            <a href="#planning" className="text-gray-400 text-sm py-2 border-b border-gray-800" onClick={() => setMenuOuvert(false)}>Planning</a>
            <a href="#concours" className="text-gray-400 text-sm py-2 border-b border-gray-800" onClick={() => setMenuOuvert(false)}>Concours</a>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-lg text-sm font-semibold mt-2"
              style={{ background: 'linear-gradient(135deg, #C9A84C, #8B6914)', color: '#071020' }}>
              Se connecter
            </button>
          </div>
        )}
      </nav>

      {/* HERO */}
      <div className="relative overflow-hidden py-16 md:py-24 px-4"
        style={{ background: 'linear-gradient(135deg, #071020 0%, #0d1f3c 100%)' }}>
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.1) 0%, transparent 70%)' }} />
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-sm tracking-[0.3em] mb-4" style={{ color: '#C9A84C' }}>BIENVENUE SUR</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Le Portail <span style={{ color: '#C9A84C' }}>Genius Group</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Votre espace de préparation aux concours des grandes écoles. Suivez votre progression, accédez à vos ressources et atteignez vos objectifs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="px-8 py-3 rounded-xl font-bold text-sm tracking-widest transition"
              style={{ background: 'linear-gradient(135deg, #C9A84C, #8B6914)', color: '#071020' }}>
              ACCÉDER À MON ESPACE
            </button>
            <a href="#concours"
              className="px-8 py-3 rounded-xl font-bold text-sm tracking-widest transition text-white"
              style={{ border: '1px solid rgba(201,168,76,0.4)' }}>
              DÉCOUVRIR LA MÉTHODE
            </a>
          </div>
        </div>
      </div>

      {/* FIL D'ACTUALITÉS */}
      <section id="actualites" className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>Restez informé</p>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>Fil d'actualité</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actualites.map(actu => (
            <div key={actu.id}
              className="bg-white rounded-2xl p-5 transition-all duration-200 hover:shadow-lg cursor-pointer"
              style={{ border: '1px solid #f0ece0' }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
                  style={{ background: `${actu.couleur}15` }}>
                  {actu.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${actu.couleur}15`, color: actu.couleur }}>
                      {actu.type}
                    </span>
                    <span className="text-xs text-gray-400">{actu.date}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1 text-sm md:text-base">{actu.titre}</h3>
                  <p className="text-gray-500 text-xs md:text-sm leading-relaxed">{actu.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PLANNING PUBLIC */}
      <section id="planning" className="px-4 py-12"
        style={{ background: 'linear-gradient(135deg, #071020, #0d1f3c)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>Événements à venir</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Emploi du temps global</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {evenements.map((ev, i) => (
              <div key={i}
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${couleurType[ev.type]}40`
                }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: `${couleurType[ev.type]}20` }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: couleurType[ev.type] }} />
                </div>
                <p className="text-xs font-bold mb-1" style={{ color: couleurType[ev.type] }}>{ev.date}</p>
                <p className="text-white text-sm font-semibold mb-1">{ev.titre}</p>
                <p className="text-gray-500 text-xs">{ev.heure}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATALOGUE CONCOURS */}
      <section id="concours" className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>Notre expertise</p>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>Catalogue La Méthode Genius</h2>
          <p className="text-gray-500 mt-2">Tous les concours que nous préparons</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {concours.map((c, i) => (
            <div key={i}
              className="bg-white rounded-2xl p-5 flex items-center gap-4 hover:shadow-lg transition cursor-pointer"
              style={{ border: '1px solid #f0ece0' }}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                style={{ background: 'rgba(201,168,76,0.1)' }}>
                {c.icon}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">{c.nom}</h3>
                <p className="text-gray-500 text-xs mt-0.5">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-12 text-center"
        style={{ background: 'linear-gradient(135deg, #071020, #0d1f3c)' }}>
        <div className="max-w-2xl mx-auto">
          <span className="text-4xl">🧠</span>
          <h2 className="text-2xl md:text-3xl font-bold text-white mt-4 mb-3">
            Prêt à rejoindre <span style={{ color: '#C9A84C' }}>Genius Group</span> ?
          </h2>
          <p className="text-gray-400 mb-6">Connectez-vous à votre espace personnel pour accéder à tous vos outils.</p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 rounded-xl font-bold text-sm tracking-widest"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #8B6914)', color: '#071020' }}>
            SE CONNECTER
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-center py-6 text-gray-600 text-xs"
        style={{ background: '#071020' }}>
        © 2026 Genius Group — Tous droits réservés
      </footer>

    </div>
  )
}