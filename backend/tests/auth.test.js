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

  it('connecte avec le nouveau champ identifiant (numéro d’inscription)', async () => {
    const res = await request(app).post('/api/auth/login').send({ identifiant: 'E001', password: 'Secret123' })
    expect(res.status).toBe(200)
    expect(res.body.user.matricule).toBe('E001')
    expect(res.body.user.username).toBe('eleve1')
  })

  it('accepte toujours l’ancien champ matricule (rétro-compatibilité)', async () => {
    const res = await request(app).post('/api/auth/login').send({ matricule: 'E001', password: 'Secret123' })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeTruthy()
  })

  it('connecte un professeur par son username (matricule vide)', async () => {
    resetDb({ users: [{ id: 7, matricule: null, username: 'prof.martin', nom: 'M', prenom: 'P', role: 'professeur', password: hash, bloque: false }] })
    const res = await request(app).post('/api/auth/login').send({ identifiant: 'prof.martin', password: 'Secret123' })
    expect(res.status).toBe(200)
    expect(res.body.user.role).toBe('professeur')
    expect(res.body.user.username).toBe('prof.martin')
  })

  // Rapport QA n°10 : message d'erreur entièrement en français
  it('connexion vide → 400 avec libellés français (pas « identifiant, password »)', async () => {
    const res = await request(app).post('/api/auth/login').send({})
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Données invalides : Identifiant, Mot de passe')
    expect(res.body.message).not.toMatch(/password|matricule/i)
    expect(res.body.champs).toEqual(['identifiant', 'password']) // clés techniques conservées pour le front
  })

  // Rapport QA n°11 : une saisie malformée donne 400, jamais 500
  it.each(["' OR 1=1 --", "admin'; DROP TABLE users;--", 'a" OR "1"="1', '1) or (1=1', 'x%27%20or%201=1'])(
    'identifiant malformé %j → 400',
    async (charge) => {
      const res = await request(app).post('/api/auth/login').send({ matricule: charge, password: 'x' })
      expect(res.status).toBe(400)
    }
  )

  it('les identifiants usuels (matricule, prof.martin, e-mail, accents) restent acceptés (401 si inconnus)', async () => {
    for (const id of ['26GEN0001', 'prof.martin', 'jean-marie_k', 'awa@exemple.ci', 'Kouamé Yao']) {
      const res = await request(app).post('/api/auth/login').send({ matricule: id, password: 'x' })
      expect(res.status).toBe(401)
    }
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
    expect(res.body.message).toBe('Identifiant ou mot de passe incorrect')
  })

  it('renvoie le même message pour un identifiant inconnu', async () => {
    const res = await request(app).post('/api/auth/login').send({ matricule: 'INCONNU', password: 'Secret123' })
    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Identifiant ou mot de passe incorrect')
  })

  it('refuse un identifiant vide ou absent (400, libellé « Identifiant »)', async () => {
    const vide = await request(app).post('/api/auth/login').send({ identifiant: '', password: 'x' })
    expect(vide.status).toBe(400)
    expect(vide.body.message).toBe('Données invalides : Identifiant')
    const absent = await request(app).post('/api/auth/login').send({ password: 'x' })
    expect(absent.status).toBe(400)
    expect(absent.body.message).toBe('Données invalides : Identifiant')
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
    // Identifiant dédié : le limiteur compte par IP + identifiant, partagé entre les tests du fichier
    resetDb({ users: [{ ...eleve, id: 2, matricule: 'E002' }] })
    for (let i = 0; i < 5; i++) {
      const r = await request(app).post('/api/auth/login').send({ matricule: 'E002', password: 'faux' })
      expect(r.status).toBe(401)
    }
    const res = await request(app).post('/api/auth/login').send({ matricule: 'E002', password: 'Secret123' })
    expect(res.status).toBe(429)
  })

  it('le limiteur compte pareil avec identifiant et avec l’ancien matricule', async () => {
    resetDb({ users: [{ ...eleve, id: 3, matricule: 'E003' }] })
    for (let i = 0; i < 3; i++) await request(app).post('/api/auth/login').send({ identifiant: 'E003', password: 'faux' })
    for (let i = 0; i < 2; i++) await request(app).post('/api/auth/login').send({ matricule: 'E003', password: 'faux' })
    const res = await request(app).post('/api/auth/login').send({ identifiant: 'E003', password: 'Secret123' })
    expect(res.status).toBe(429)
  })
})
