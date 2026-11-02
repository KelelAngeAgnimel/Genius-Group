import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { resetDb } from './helpers/supabaseMock.js'
import { bearer } from './helpers/tokens.js'

vi.mock('../supabase.js', async () => ({ default: (await import('./helpers/supabaseMock.js')).supabaseMock }))

const { default: app } = await import('../app.js')

const hash = bcrypt.hashSync('Secret123', 4)
const eleve = { id: 1, matricule: 'E001', username: 'eleve1', nom: 'A', prenom: 'B', role: 'etudiant_inphb', password: hash, bloque: false }

describe('POST /api/auth/login', () => {
  beforeEach(() => resetDb({ users: [{ ...eleve }] }))

  it('connecte avec les bons identifiants (token + utilisateur sans mot de passe)', async () => {
    const res = await request(app).post('/api/auth/login').send({ matricule: 'E001', password: 'Secret123' })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeTruthy()
    expect(res.body.user.id).toBe(1)
    expect(res.body.user.password).toBeUndefined()
  })

  it('renvoie la liste des concours dans la réponse et le JWT (inscriptions)', async () => {
    resetDb({
      users: [{ ...eleve, role: 'etudiant' }],
      inscriptions: [{ user_id: 1, concours_code: 'ensea' }, { user_id: 1, concours_code: 'inphb' }]
    })
    const res = await request(app).post('/api/auth/login').send({ matricule: 'E001', password: 'Secret123' })
    expect(res.status).toBe(200)
    expect(res.body.user.role).toBe('etudiant')
    expect(res.body.user.concours.sort()).toEqual(['ensea', 'inphb'])
    expect(jwt.decode(res.body.token).concours.sort()).toEqual(['ensea', 'inphb'])
  })

  it('ancien rôle combiné (avant migration) : concours déduits, rôle normalisé', async () => {
    resetDb({ users: [{ ...eleve, role: 'etudiant_all' }] })
    const res = await request(app).post('/api/auth/login').send({ matricule: 'E001', password: 'Secret123' })
    expect(res.body.user.role).toBe('etudiant')
    expect(res.body.user.concours.sort()).toEqual(['cme', 'esatic', 'inphb'])
  })

  it('GET /api/users/me renvoie les concours', async () => {
    resetDb({ users: [{ ...eleve, role: 'etudiant' }], inscriptions: [{ user_id: 1, concours_code: 'ensea' }] })
    const res = await request(app).get('/api/users/me').set(bearer(1))
    expect(res.status).toBe(200)
    expect(res.body.concours).toEqual(['ensea'])
  })

  it('refuse un mauvais mot de passe (401)', async () => {
    const res = await request(app).post('/api/auth/login').send({ matricule: 'E001', password: 'faux' })
    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Identifiants incorrects')
  })

  it('renvoie le même message pour un identifiant inconnu', async () => {
    const res = await request(app).post('/api/auth/login').send({ matricule: 'INCONNU', password: 'Secret123' })
    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Identifiants incorrects')
  })

  it('refuse un corps invalide (400)', async () => {
    const res = await request(app).post('/api/auth/login').send({ matricule: '' })
    expect(res.status).toBe(400)
  })

  it('refuse un compte bloqué au login (403)', async () => {
    resetDb({ users: [{ ...eleve, bloque: true }] })
    const res = await request(app).post('/api/auth/login').send({ matricule: 'E001', password: 'Secret123' })
    expect(res.status).toBe(403)
    expect(res.body.token).toBeUndefined()
  })

  it('bloque après 5 échecs (429), même avec le bon mot de passe', async () => {
    // Matricule dédié : le limiteur compte par IP + identifiant, partagé entre les tests du fichier
    resetDb({ users: [{ ...eleve, id: 2, matricule: 'E002' }] })
    for (let i = 0; i < 5; i++) {
      const r = await request(app).post('/api/auth/login').send({ matricule: 'E002', password: 'faux' })
      expect(r.status).toBe(401)
    }
    const res = await request(app).post('/api/auth/login').send({ matricule: 'E002', password: 'Secret123' })
    expect(res.status).toBe(429)
  })
})
