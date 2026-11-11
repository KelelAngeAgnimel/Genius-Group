import { useConcours } from '../../hooks/useConcours'
import CarteConcoursBanniere from '../../components/CarteConcoursBanniere'
import GrilleConcours from '../../components/GrilleConcours'

const cartes = [
  {
    sigle: 'INP-HB',
    nom: 'Institut National Polytechnique Félix Houphouët-Boigny',
    site: 'https://inphb.ci',
    code: 'inphb'
  },
  {
    sigle: 'ESATIC',
    nom: "Ecole Supérieure Africaine des Technologies de l'Info. et de la Com.",
    site: 'https://esatic.ci',
    code: 'esatic'
  },
  {
    sigle: 'CME',
    nom: 'Concours des Meilleurs Etudiants',
    site: '#',
    code: 'cme'
  },
  {
    sigle: 'ENSEA',
    nom: 'École Nationale Supérieure de Statistique et d’Économie Appliquée',
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

      <GrilleConcours>
        {cartesVisibles.map(carte => {
          const aUnSite = carte.site && carte.site !== '#' // CME : pas de site officiel renseigné
          return (
            <CarteConcoursBanniere key={carte.code} code={carte.code} sousTitre={carte.nom}
              action={aUnSite ? 'Visiter le site' : undefined}
              onClick={aUnSite ? () => window.open(carte.site, '_blank', 'noopener,noreferrer') : undefined} />
          )
        })}
      </GrilleConcours>
    </div>
  )
}