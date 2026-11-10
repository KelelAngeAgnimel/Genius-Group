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

// Rapport QA n°12 : contrôle d'accès par rôle sur l'administration
describe('Liste des utilisateurs (/api/users/all)', () => {
  beforeEach(() => {
    invalidateUserCache()
    resetDb({ users: [user(30, 'admin'), user(20, 'professeur'), user(10, 'etudiant'), user(11, 'etudiant_inphb')] })
  })

  it('sans token → 401', async () => {
    expect((await request(app).get('/api/users/all')).status).toBe(401)
  })

  it('un élève reçoit 403', async () => {
    expect((await request(app).get('/api/users/all').set(bearer(10))).status).toBe(403)
    expect((await request(app).get('/api/users/all').set(bearer(11))).status).toBe(403)
  })

  it('un élève ne peut ni créer ni supprimer un compte → 403', async () => {
    const c = await request(app).post('/api/users/create').set(bearer(10)).send({ password: 'motdepasse', role: 'admin', username: 'x', nom: 'A', prenom: 'B' })
    expect(c.status).toBe(403)
    expect((await request(app).delete('/api/users/30').set(bearer(10))).status).toBe(403)
  })

  it('un admin reçoit 200', async () => {
    const r = await request(app).get('/api/users/all').set(bearer(30))
    expect(r.status).toBe(200)
    expect(Array.isArray(r.body.users)).toBe(true)
  })
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

  // Rapport QA n°6 : un seul numéro par élève (celui affiché = celui de la liste = celui qui connecte)
  it("l'identifiant de connexion d'un élève est son matricule", async () => {
    const r = await request(app).post('/api/users/create').set(bearer(30)).send({
      password: 'motdepasse', nom: 'Dupont', prenom: 'Awa', role: 'etudiant', concours: ['inphb'], modalite: 'presentiel'
    })
    expect(r.status).toBe(201)
    expect(r.body.user.username).toBe(r.body.user.matricule)
    const liste = await request(app).get('/api/users/all').set(bearer(30))
    const cree = liste.body.users.find(u => u.id === r.body.user.id)
    expect(cree.matricule).toBe(r.body.user.matricule)
    expect(cree.username).toBe(cree.matricule)
  })

  it('refuse un élève sans concours ni modalité', async () => {
    const base = { password: 'motdepasse', nom: 'Dupont', prenom: 'Awa', role: 'etudiant' }
    expect((await request(app).post('/api/users/create').set(bearer(30)).send({ ...base, modalite: 'en_ligne' })).status).toBe(400)
    expect((await request(app).post('/api/users/create').set(bearer(30)).send({ ...base, concours: ['ensea'] })).status).toBe(400)
  })

  it('un professeur exige un identifiant et peut être rattaché à un concours', async () => {
    const sans = await request(app).post('/api/users/create').set(bearer(30)).send({ password: 'motdepasse', nom: 'Martin', prenom: 'Paul', role: 'professeur', username: '' })
    expect(sans.status).toBe(400)
    const ok = await request(app).post('/api/users/create').set(bearer(30)).send({ password: 'motdepasse', nom: 'Martin', prenom: 'Paul', role: 'professeur', username: 'prof.ensea', concours: ['ensea'] })
    expect(ok.status).toBe(201)
    expect(ok.body.user.concours).toEqual(['ensea'])
  })

  // Rapport QA n°8
  it('refuse la création sans prénom ou sans nom, ou avec un nom vide', async () => {
    const base = { password: 'motdepasse', role: 'etudiant', concours: ['ensea'], modalite: 'en_ligne' }
    const post = (corps) => request(app).post('/api/users/create').set(bearer(30)).send(corps)
    for (const corps of [base, { ...base, nom: 'Dupont' }, { ...base, prenom: 'Awa' }, { ...base, nom: '  ', prenom: 'Awa' }]) {
      const r = await post(corps)
      expect(r.status).toBe(400)
      expect(r.body.message).toMatch(/^Données invalides : /)
    }
    expect(tables.users).toHaveLength(2) // aucun compte créé
    expect((await post({ ...base, nom: 'Dupont', prenom: 'Awa' })).status).toBe(201)
  })

  it('seul un admin crée des comptes', async () => {
    const r = await request(app).post('/api/users/create').set(bearer(20)).send({ password: 'motdepasse', role: 'etudiant', concours: ['ensea'], modalite: 'en_ligne' })
    expect(r.status).toBe(403)
  })
})
