import { useConcours } from '../../hooks/useConcours'

const cartes = [
  {
    sigle: 'INP-HB',
    nom: 'Institut National Polytechnique Félix Houphouët-Boigny',
    logo: 'https://inphb.edu.ci/wp-content/uploads/2020/03/INPHB.png',
    site: 'https://inphb.ci',
    couleur: '#C9A84C',
    bande: 'linear-gradient(90deg, rgba(201,168,76,0.2), #C9A84C, #e8c76a, #C9A84C, rgba(201,168,76,0.2))',
    tags: ['Concours CPGE', 'Résultats', 'Admissions', 'Actualités'],
    code: 'inphb'
  },
  {
    sigle: 'ESATIC',
    nom: "Ecole Supérieure Africaine des Technologies de l'Info. et de la Com.",
    logo: 'https://esatic.ci/wp-content/uploads/2024/07/esatic_logo.jpg',
    site: 'https://esatic.ci',
    couleur: '#4C7BC9',
    bande: 'linear-gradient(90deg, rgba(76,123,201,0.2), #4C7BC9, #6b9de0, #4C7BC9, rgba(76,123,201,0.2))',
    tags: ['Concours', 'Résultats', 'Inscriptions', 'Actualités'],
    code: 'esatic'
  },
  {
    sigle: 'CME',
    nom: 'Concours des Meilleurs Etudiants',
    logo: '/cme-logo.png',
    site: '#',
    couleur: '#4CC9A8',
    bande: 'linear-gradient(90deg, rgba(76,201,168,0.2), #4CC9A8, #7de8cf, #4CC9A8, rgba(76,201,168,0.2))',
    tags: ['Concours CME', 'Résultats', 'Inscriptions', 'Actualités'],
    code: 'cme'
  },
  {
    sigle: 'ENSEA',
    nom: 'École Nationale Supérieure de Statistique et d’Économie Appliquée',
    logo: '/ensea-logo.png',
    site: 'https://ensea.ed.ci',
    couleur: '#7B4CC9',
    bande: 'linear-gradient(90deg, rgba(123,76,201,0.2), #7B4CC9, #a37be0, #7B4CC9, rgba(123,76,201,0.2))',
    tags: ['Concours', 'Résultats', 'Inscriptions', 'Actualités'],
    code: 'ensea'
  },
]

export default function Actualites() {

  const { peutAcceder } = useConcours()
  const cartesVisibles = cartes.filter(c => peutAcceder(c.code))

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>

      <div className="mb-6 md:mb-8">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#8A6D1A' }}>
          Actualités
        </p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>
          Sites officiels & Actualités
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Suivez les dernières actualités de vos concours
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {cartesVisibles.map((carte, i) => (
          <a key={i} href={carte.site} target="_blank" rel="noopener noreferrer"
            className="rounded-2xl overflow-hidden block transition-all duration-200 hover:shadow-xl hover:scale-105"
            style={{
              background: 'linear-gradient(145deg, #071020, #0d1f3c)',
              border: `1px solid ${carte.couleur}40`,
              textDecoration: 'none'
            }}>

            <div className="flex items-center justify-center py-10 px-8">
              <img src={carte.logo} alt={carte.sigle}
                style={{ maxHeight: '100px', maxWidth: '200px', objectFit: 'contain' }}
                onError={e => {
                  e.target.style.display = 'none'
                  e.target.parentNode.innerHTML = `<span style="font-size:36px;font-weight:900;color:${carte.couleur}">${carte.sigle}</span>`
                }}
              />
            </div>

            <div className="h-0.5" style={{ background: carte.bande }} />

            <div className="p-5">
              <p className="font-bold text-white text-sm">{carte.sigle}</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{carte.nom}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {carte.tags.map((tag, ti) => (
                  <span key={ti} className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: `${carte.couleur}18`, color: carte.couleur }}>
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-xs mt-3 font-semibold" style={{ color: carte.couleur }}>
                Visiter le site →
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}