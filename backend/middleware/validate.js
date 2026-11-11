// validate(schema) : valide req.body avec zod et le remplace par la version nettoyée.
// En cas d'échec : 400 avec la liste des champs fautifs (jamais de détail interne).
// Libellés français affichés à l'utilisateur (la clé technique reste dans `champs` pour le frontend)
const LIBELLES = {
  identifiant: 'Identifiant', matricule: 'Identifiant', username: 'Identifiant', password: 'Mot de passe',
  nom: 'Nom', prenom: 'Prénom', role: 'Rôle', concours: 'Concours', modalite: 'Modalité',
  message: 'Message', corps: 'Contenu de la requête'
}
const libelle = (champ) => LIBELLES[champ] || LIBELLES[champ.split('.')[0]] || champ

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {})
  if (!result.success) {
    const champs = [...new Set(result.error.issues.map(i => i.path.join('.') || 'corps'))]
    const msg = `Données invalides : ${[...new Set(champs.map(libelle))].join(', ')}`
    return res.status(400).json({ message: msg, error: msg, champs })
  }
  req.body = result.data
  next()
}
