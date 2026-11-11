// Identifiant de connexion affiché à l'utilisateur.
// Étudiant : numéro d'inscription (users.matricule, égal à users.username).
// Professeur / admin : matricule vide, l'identifiant est le username.
// Les champs de données `matricule` et `username` restent inchangés côté API.
export const identifiantDe = (u) => u?.matricule || u?.username || ''
