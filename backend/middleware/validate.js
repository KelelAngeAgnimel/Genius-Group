// validate(schema) : valide req.body avec zod et le remplace par la version nettoyée.
// En cas d'échec : 400 avec la liste des champs fautifs (jamais de détail interne).
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {})
  if (!result.success) {
    const champs = [...new Set(result.error.issues.map(i => i.path.join('.') || 'corps'))]
    const msg = `Données invalides : ${champs.join(', ')}`
    return res.status(400).json({ message: msg, error: msg, champs })
  }
  req.body = result.data
  next()
}
