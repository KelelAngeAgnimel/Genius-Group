import { CODES_CONCOURS } from './concours'

// Concours que l'utilisateur peut voir (élève : les siens ; professeur / admin : selon leurs droits)
export const concoursVisibles = (peutAcceder) => CODES_CONCOURS.filter(code => peutAcceder(code))
