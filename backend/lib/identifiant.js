// Identifiant de connexion : lettres, chiffres, espace et . _ @ + - seulement.
// Tout le reste (apostrophe, guillemet, point-virgule, =, parenthèses…) est refusé en 400 avant la base.
export const IDENTIFIANT_VALIDE = /^[\p{L}\p{N} ._@+-]+$/u
