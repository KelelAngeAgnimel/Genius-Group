// Gestionnaire d'erreurs central : le détail reste dans les logs serveur,
// le client ne reçoit qu'un message générique.
// Les deux clés (message / error) sont renvoyées car le frontend lit l'une ou l'autre selon la page.

export function notFound(req, res) {
  res.status(404).json({ message: 'Route introuvable', error: 'Route introuvable' })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error(`[erreur] ${req.method} ${req.originalUrl} (user: ${req.user?.id ?? 'anonyme'})`, err)

  if (res.headersSent) return

  // Corps JSON invalide ou trop volumineux (body-parser)
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Requête trop volumineuse', error: 'Requête trop volumineuse' })
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Requête invalide', error: 'Requête invalide' })
  }

  res.status(500).json({ message: 'Erreur serveur', error: 'Erreur serveur' })
}
