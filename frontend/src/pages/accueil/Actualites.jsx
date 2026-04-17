import { useAuth } from '../../context/AuthContext'

const cartes = [
  {
    sigle: 'INP-HB',
    nom: 'Institut National Polytechnique Félix Houphouët-Boigny',
    logo: 'https://inphb.edu.ci/wp-content/uploads/2020/03/INPHB.png',
    site: 'https://inphb.ci',
    couleur: '#C9A84C',
    bande: 'linear-gradient(90deg, rgba(201,168,76,0.2), #C9A84C, #e8c76a, #C9A84C, rgba(201,168,76,0.2))',
    tags: ['Concours CPGE', 'Résultats', 'Admissions', 'Actualités'],
    roles: ['etudiant_inphb', 'etudiant_both', 'admin', 'professeur']
  },
  {
    sigle: 'ESATIC',
    nom: 'Ecole Supérieure Africaine des Technologies de l\'Info. et de la Com.',
    logo: 'https://esatic.ci/wp-content/uploads/2024/07/esatic_logo.jpg',
    site: 'https://esatic.ci',
    couleur: '#4C7BC9',
    bande: 'linear-gradient(90deg, rgba(76,123,201,0.2), #4C7BC9, #6b9de0, #4C7BC9, rgba(76,123,201,0.2))',
    tags: ['Concours', 'Résultats', 'Inscriptions', 'Actualités'],
    roles: ['etudiant_esatic', 'etudiant_both', 'admin', 'professeur']
  }
]

export default function Actualites() {
  const { user } = useAuth()

  const cartesVisibles = cartes.filter(c => c.roles.includes(user?.role))

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>

      {/* En-tête */}
      <div className="mb-6 md:mb-8">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>
          Actualités
        </p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>
          Sites officiels & Actualités
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Retrouvez les dernières actualités des écoles partenaires
        </p>
      </div>

      {/* Séparateur décoratif */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(201,168,76,0.4), transparent)' }} />
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#C9A84C' }} />
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#C9A84C' }}>
            Ecoles partenaires
          </span>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#C9A84C' }} />
        </div>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.4))' }} />
      </div>

      {/* Cartes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cartesVisibles.map((carte, i) => (
          
            key={i}
            href={carte.site}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
            style={{
              background: 'linear-gradient(145deg, #071020 0%, #0d1f3c 60%, #102040 100%)',
              border: `1px solid ${carte.couleur}40`,
              textDecoration: 'none',
              display: 'block',
            }}
          >
            {/* Bande colorée en haut */}
            <div style={{ height: '3px', background: carte.bande }} />

            <div className="p-5">
              {/* Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white flex items-center justify-center flex-shrink-0 p-1.5"
                  style={{ boxShadow: `0 0 0 2px ${carte.couleur}66` }}>
                  <img
                    src={carte.logo}
                    alt={carte.sigle}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.parentNode.innerHTML = `<span style="font-weight:bold;color:${carte.couleur};font-size:12px;text-align:center">${carte.sigle}</span>`
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-lg leading-tight">{carte.sigle}</p>
                  <p className="text-xs leading-relaxed mt-0.5" style={{ color: `${carte.couleur}CC` }}>
                    {carte.nom}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
                  style={{ background: `${carte.couleur}20`, border: `1px solid ${carte.couleur}55` }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 13L13 3M13 3H7M13 3V9" stroke={carte.couleur} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* Séparateur */}
              <div className="h-px mb-4" style={{ background: `${carte.couleur}25` }} />

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {carte.tags.map((tag, j) => (
                  <span key={j} className="text-xs px-2.5 py-1 rounded-lg font-medium"
                    style={{
                      background: `${carte.couleur}18`,
                      border: `1px solid ${carte.couleur}33`,
                      color: `${carte.couleur}EE`
                    }}>
                    {tag}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Retrouvez toutes les actualités officielles</p>
                <span className="text-xs font-bold transition-all duration-200 group-hover:tracking-wider"
                  style={{ color: carte.couleur }}>
                  Visiter →
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}