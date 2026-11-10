import { useConcours } from '../../hooks/useConcours'

const cartes = [
  {
    sigle: 'INP-HB',
    nom: 'Institut National Polytechnique Félix Houphouët-Boigny',
    logo: 'https://inphb.edu.ci/wp-content/uploads/2020/03/INPHB.png',
    site: 'https://inphb.ci',
    code: 'inphb'
  },
  {
    sigle: 'ESATIC',
    nom: "Ecole Supérieure Africaine des Technologies de l'Info. et de la Com.",
    logo: 'https://esatic.ci/wp-content/uploads/2024/07/esatic_logo.jpg',
    site: 'https://esatic.ci',
    code: 'esatic'
  },
  {
    sigle: 'CME',
    nom: 'Concours des Meilleurs Etudiants',
    logo: '/cme-logo.png',
    site: '#',
    code: 'cme'
  },
  {
    sigle: 'ENSEA',
    nom: 'École Nationale Supérieure de Statistique et d’Économie Appliquée',
    logo: '/ensea-logo.png',
    site: 'https://ensea.ed.ci',
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
        <p className="text-gray-500 text-sm mt-1">
          Suivez les dernières actualités de vos concours
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {cartesVisibles.map((carte, i) => (
          <a key={i} href={carte.site} target="_blank" rel="noopener noreferrer"
            className="rounded-2xl overflow-hidden block bg-white transition-colors hover:border-gray-400"
            style={{ border: '1px solid #e5e7eb', textDecoration: 'none' }}>

            <div className="flex items-center justify-center py-8 px-8" style={{ borderBottom: '1px solid #e5e7eb' }}>
              <img src={carte.logo} alt={carte.sigle}
                style={{ maxHeight: '90px', maxWidth: '200px', objectFit: 'contain' }}
                onError={e => {
                  const parent = e.target.parentNode
                  e.target.style.display = 'none'
                  const span = document.createElement('span')
                  span.textContent = carte.sigle
                  span.style.cssText = 'font-size:28px;font-weight:700;color:#071020'
                  parent.appendChild(span)
                }}
              />
            </div>

            <div className="p-5">
              <p className="font-bold text-sm" style={{ color: '#071020' }}>{carte.sigle}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{carte.nom}</p>
              <p className="text-xs mt-3 font-semibold underline underline-offset-4" style={{ color: '#8A6D1A' }}>
                Visiter le site
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}