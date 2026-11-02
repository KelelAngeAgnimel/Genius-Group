import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { resetDb, tables } from './helpers/supabaseMock.js'
import { bearer } from './helpers/tokens.js'

vi.mock('../supabase.js', async () => ({ default: (await import('./helpers/supabaseMock.js')).supabaseMock }))

const { default: app } = await import('../app.js')
const { invalidateUserCache } = await import('../middleware/authMiddleware.js')

const user = (id, role) => ({ id, matricule: null, username: `u${id}`, role, modalite: null, bloque: false })

beforeEach(() => {
  invalidateUserCache()
  resetDb({ users: [user(30, 'admin'), user(20, 'professeur')] })
})

describe('Création de comptes (admin)', () => {
  it('crée un élève ENSEA même si le formulaire envoie un identifiant vide', async () => {
    const r = await request(app).post('/api/users/create').set(bearer(30)).send({
      username: '', password: 'motdepasse', nom: 'Dupont', prenom: 'Awa',
      role: 'etudiant', concours: ['ensea'], modalite: 'en_ligne'
    })
    expect(r.status).toBe(201)
    expect(r.body.user.role).toBe('etudiant')
    expect(r.body.user.matricule).toMatch(/^\d{2}GEN\d{4}$/)
    expect(r.body.user.concours).toEqual(['ensea'])
    expect(tables.inscriptions).toHaveLength(1)
    expect(tables.inscriptions[0]).toMatchObject({ user_id: r.body.user.id, concours_code: 'ensea' })
  })

  it('refuse un élève sans concours ni modalité', async () => {
    const base = { password: 'motdepasse', role: 'etudiant' }
    expect((await request(app).post('/api/users/create').set(bearer(30)).send({ ...base, modalite: 'en_ligne' })).status).toBe(400)
    expect((await request(app).post('/api/users/create').set(bearer(30)).send({ ...base, concours: ['ensea'] })).status).toBe(400)
  })

  it('un professeur exige un identifiant et peut être rattaché à un concours', async () => {
    const sans = await request(app).post('/api/users/create').set(bearer(30)).send({ password: 'motdepasse', role: 'professeur', username: '' })
    expect(sans.status).toBe(400)
    const ok = await request(app).post('/api/users/create').set(bearer(30)).send({ password: 'motdepasse', role: 'professeur', username: 'prof.ensea', concours: ['ensea'] })
    expect(ok.status).toBe(201)
    expect(ok.body.user.concours).toEqual(['ensea'])
  })

  it('seul un admin crée des comptes', async () => {
    const r = await request(app).post('/api/users/create').set(bearer(20)).send({ password: 'motdepasse', role: 'etudiant', concours: ['ensea'], modalite: 'en_ligne' })
    expect(r.status).toBe(403)
  })
})
