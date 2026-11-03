import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { resetDb } from './helpers/supabaseMock.js'
import { bearer } from './helpers/tokens.js'

vi.mock('../supabase.js', async () => ({ default: (await import('./helpers/supabaseMock.js')).supabaseMock }))

const { default: app } = await import('../app.js')
const { invalidateUserCache } = await import('../middleware/authMiddleware.js')

const user = (id, role) => ({ id, matricule: `M${id}`, username: `u${id}`, role, modalite: null, bloque: false })
const note = (etudiant_id, concours, matiere, valeur) =>
  ({ id: `${etudiant_id}-${concours}-${matiere}`, etudiant_id, concours, matiere, note: valeur, periode: 'Mar 2026', created_at: '2026-03-01T10:00:00Z' })

beforeEach(() => {
  invalidateUserCache()
  resetDb({
    users: [user(10, 'etudiant'), user(11, 'etudiant'), user(12, 'etudiant'), user(30, 'admin')],
    inscriptions: [
      { user_id: 10, concours_code: 'ensea' },                                   // a quitté INP-HB pour ENSEA
      { user_id: 11, concours_code: 'inphb' }, { user_id: 11, concours_code: 'esatic' },
      { user_id: 12, concours_code: 'ensea' }
    ],
    notes: [
      note(10, 'INP-HB', 'Culture Générale', 8),     // ancien concours
      note(10, 'ENSEA', 'Mathématiques', 14),
      note(11, 'INP-HB', 'Culture Générale', 12),
      note(11, 'ESATIC', 'Physique', 16),
      note(11, 'ENSEA', 'Mathématiques', 18),        // jamais inscrit : donnée parasite
      note(12, 'ENSEA', 'Français', 10)
    ]
  })
})

const codes = (notes) => [...new Set(notes.map(n => n.concours))].sort()

describe('GET /api/notes/mes-notes — filtrage par concours', () => {
  it('un élève qui a changé de concours ne voit plus les notes de l’ancien', async () => {
    const r = await request(app).get('/api/notes/mes-notes').set(bearer(10))
    expect(r.status).toBe(200)
    expect(codes(r.body.notes)).toEqual(['ENSEA'])
  })

  it('un élève INP-HB + ESATIC ne voit rien d’ENSEA', async () => {
    const r = await request(app).get('/api/notes/mes-notes').set(bearer(11))
    expect(codes(r.body.notes)).toEqual(['ESATIC', 'INP-HB'])
  })

  it('refuse le personnel (route réservée aux élèves)', async () => {
    expect((await request(app).get('/api/notes/mes-notes').set(bearer(30))).status).toBe(403)
  })
})

describe('GET /api/tableaux/eleve — filtrage par concours', () => {
  it('exclut les notes du concours quitté des matières, de la moyenne et des dernières notes', async () => {
    const r = await request(app).get('/api/tableaux/eleve').set(bearer(10))
    expect(r.status).toBe(200)
    expect(r.body.matieres.map(m => m.matiere)).toEqual(['Mathématiques'])
    expect(r.body.moyenne_generale).toBe(14)
    expect(r.body.moyennes_concours).toEqual({ ensea: 14 })
    expect(r.body.dernieres.every(n => n.concours === 'ENSEA')).toBe(true)
  })

  it('donne une moyenne par concours à un élève INP-HB + ESATIC, sans ENSEA', async () => {
    const r = await request(app).get('/api/tableaux/eleve').set(bearer(11))
    expect(r.body.moyennes_concours).toEqual({ inphb: 12, esatic: 16 })
    expect(r.body.moyenne_generale).toBe(14)
  })
})
