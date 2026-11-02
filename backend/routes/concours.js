import express from 'express'
import supabase from '../supabase.js'
import { verifyToken } from '../middleware/authMiddleware.js'
import { CODES_CONCOURS, LIBELLES } from '../lib/concours.js'

const router = express.Router()

// GET /api/concours — référentiel des concours actifs (cases à cocher, filtres, options)
router.get('/', verifyToken, async (req, res) => {
  const { data, error } = await supabase
    .from('concours').select('code, nom, actif, options').eq('actif', true).order('code')
  // Table absente (migration pas encore lancée) : liste par défaut
  if (error) {
    return res.json({ concours: CODES_CONCOURS.map(code => ({ code, nom: LIBELLES[code], actif: true, options: {} })) })
  }
  res.json({ concours: data })
})

export default router
