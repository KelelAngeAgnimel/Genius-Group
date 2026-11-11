import rateLimit, { ipKeyGenerator } from 'express-rate-limit'

const reponse = (message) => ({ message, error: message })

// Login : 5 échecs / 15 min par IP + identifiant (les connexions réussies ne comptent pas)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ident = String(req.body?.identifiant ?? req.body?.matricule ?? '').trim().toLowerCase().slice(0, 64)
    return `${ipKeyGenerator(req.ip)}|${ident}`
  },
  message: reponse('Trop de tentatives. Réessayez dans 15 minutes.')
})

// Chat et IA : 20 requêtes / minute par utilisateur (à placer APRÈS verifyToken)
export const iaLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => `user:${req.user?.id ?? ipKeyGenerator(req.ip)}`,
  message: reponse('Trop de requêtes. Patientez une minute.')
})

// Dépôts de fichiers : 15 envois / 15 min par utilisateur (à placer APRÈS verifyToken)
export const depotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => `depot:${req.user?.id ?? ipKeyGenerator(req.ip)}`,
  message: reponse('Trop d’envois. Réessayez dans quelques minutes.')
})
