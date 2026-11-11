import { libelleConcours, couleurConcours } from '../lib/concours'
import Banniere from './Banniere'
import CarteRessource from './CarteRessource'
import LogoConcours from './LogoConcours'

// Carte d'un concours : un seul visuel pour Ressources, Évaluations, Accueil et Orientation
// (bannière sombre aux couleurs du concours + logo en pastille, sigle coloré, sous-titre).
// Mêmes props facultatives que CarteRessource : badge, badges, action, children, onClick.
export default function CarteConcoursBanniere({ code, hauteur = 128, ...reste }) {
  const couleur = couleurConcours(code)
  return (
    <CarteRessource {...reste} couleur={couleur} titre={libelleConcours(code)}
      banniere={<Banniere couleur={couleur} hauteur={hauteur}><LogoConcours code={code} /></Banniere>} />
  )
}
