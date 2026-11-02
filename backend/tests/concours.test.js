import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { resetDb } from './helpers/supabaseMock.js'
import { bearer } from './helpers/tokens.js'

vi.mock('../supabase.js', async () => ({ default: (await import('./helpers/supabaseMock.js')).supabaseMock }))

const { default: app } = await import('../app.js')
const { invalidateUserCache } = await import('../middleware/authMiddleware.js')
const { codesDepuisContenu, peutAcceder } = await import('../lib/concours.js')

const user = (id, role) => ({ id, matricule: `M${id}`, username: `u${id}`, role, modalite: null, bloque: false })
const res_ = (id, concours) => ({ id, titre: `R${id}`, concours, visible: true, est_evaluation: false, professeur_id: 1 })
const ressources = [res_(1, 'INP-HB'), res_(2, 'ESATIC'), res_(3, 'ENSEA'), res_(4, 'tous')]
const ids = async (id) => (await request(app).get('/api/ressources').set(bearer(id))).body.ressources.map(r => r.id).sort()

describe('Cloisonnement par concours', () => {
  beforeEach(() => {
    invalidateUserCache()
    resetDb({
      users: [
        user(10, 'etudiant'), user(11, 'etudiant'), user(12, 'etudiant'),
        user(13, 'etudiant_all'), // ancien rôle, pas encore migré : aucune inscription
        user(20, 'professeur'), user(21, 'professeur'), user(30, 'admin')
      ],
      inscriptions: [
        { user_id: 10, concours_code: 'ensea' },
        { user_id: 11, concours_code: 'inphb' },
        { user_id: 12, concours_code: 'inphb' }, { user_id: 12, concours_code: 'ensea' },
        { user_id: 21, concours_code: 'ensea' }
      ],
      ressources
    })
  })

  it('un élève ENSEA ne voit pas les ressources INP-HB (ni ESATIC)', async () => {
    expect(await ids(10)).toEqual([3, 4])
  })

  it('un élève INP-HB ne voit pas les ressources ENSEA', async () => {
    expect(await ids(11)).toEqual([1, 4])
  })

  it('un élève inscrit à deux concours voit les deux', async () => {
    expect(await ids(12)).toEqual([1, 3, 4])
  })

  it('un ancien élève etudiant_all voit toujours INP-HB, ESATIC et CME (pas ENSEA)', async () => {
    expect(await ids(13)).toEqual([1, 2, 4])
  })

  it('prof sans inscription et admin voient tout ; prof ENSEA ne voit que ENSEA', async () => {
    expect(await ids(20)).toEqual([1, 2, 3, 4])
    expect(await ids(30)).toEqual([1, 2, 3, 4])
    const r = await request(app).get('/api/ressources/toutes').set(bearer(21))
    expect(r.body.ressources.map(x => x.id).sort()).toEqual([3, 4])
  })

  it('un prof ENSEA ne peut pas publier pour INP-HB', async () => {
    const r = await request(app).post('/api/ressources/upload').set(bearer(21))
      .field('titre', 'T').field('matiere', 'Maths').field('concours', 'INP-HB')
      .attach('fichier', Buffer.from('%PDF-1.4'), { filename: 'a.pdf', contentType: 'application/pdf' })
    expect(r.status).toBe(403)
  })
})

describe('lib/concours', () => {
  it('normalise les formats de la base', () => {
    expect(codesDepuisContenu('INP-HB')).toEqual(['inphb'])
    expect(codesDepuisContenu('esatic')).toEqual(['esatic'])
    expect(codesDepuisContenu('inp-hb + esatic')).toEqual(['inphb', 'esatic'])
    for (const v of ['tous', 'all', 'both', null, '']) expect(codesDepuisContenu(v)).toBeNull()
  })
  it('contenu « both » visible par un élève CME seul (comportement historique)', () => {
    expect(peutAcceder({ role: 'etudiant', concours: ['cme'] }, 'both')).toBe(true)
  })
})
