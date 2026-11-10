import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { resetDb, operations } from './helpers/supabaseMock.js'
import { bearer } from './helpers/tokens.js'

vi.mock('../supabase.js', async () => ({ default: (await import('./helpers/supabaseMock.js')).supabaseMock }))

const { default: app } = await import('../app.js')
const { invalidateUserCache } = await import('../middleware/authMiddleware.js')

const user = (id, role, extra = {}) => ({ id, matricule: `M${id}`, username: `u${id}`, role, concours: null, modalite: null, bloque: false, ...extra })
const cours = { id: 100, titre: 'Cours', professeur_id: 20, est_evaluation: false, storage_path: null, visible: true }

describe('Authentification des routes', () => {
  beforeEach(() => { resetDb(); invalidateUserCache() })

  it('chat sans token → 401', async () => {
    const res = await request(app).post('/api/chat').send({ message: 'Bonjour' })
    expect(res.status).toBe(401)
  })

  // Rapport QA n°1 : ces routes sont appelées par le front ; elles doivent exister (401, jamais 404)
  it.each([
    ['post', '/api/chat'],
    ['get', '/api/evaluations/mes'],
    ['get', '/api/evaluations/resume'],
    ['get', '/api/evaluations/gestion'],
    ['post', '/api/evaluations']
  ])('%s %s existe : sans token → 401 (pas 404)', async (methode, url) => {
    const res = await request(app)[methode](url)
    expect(res.status).toBe(401)
  })

  it('compte bloqué avec un token valide → 403', async () => {
    resetDb({ users: [user(10, 'etudiant_inphb', { bloque: true })] })
    const res = await request(app).post('/api/chat').set(bearer(10)).send({ message: 'Bonjour' })
    expect(res.status).toBe(403)
  })
})

describe('Droits sur les cours (/api/ressources)', () => {
  beforeEach(() => {
    invalidateUserCache()
    resetDb({
      users: [user(11, 'etudiant_inphb'), user(20, 'professeur'), user(21, 'professeur'), user(30, 'admin')],
      ressources: [{ ...cours }]
    })
  })
  const supprimes = () => operations.filter(o => o.table === 'ressources' && o.op === 'delete')

  it('un élève ne peut pas supprimer un cours → 403', async () => {
    const res = await request(app).delete('/api/ressources/100').set(bearer(11))
    expect(res.status).toBe(403)
    expect(supprimes()).toHaveLength(0)
  })

  it("un prof ne peut pas supprimer le cours d'un autre prof → 403", async () => {
    const res = await request(app).delete('/api/ressources/100').set(bearer(21))
    expect(res.status).toBe(403)
    expect(supprimes()).toHaveLength(0)
  })

  it("un prof ne peut pas modifier le cours d'un autre prof → 403", async () => {
    const res = await request(app).patch('/api/ressources/100/visibilite').set(bearer(21)).send({ visible: false })
    expect(res.status).toBe(403)
    expect(operations.filter(o => o.op === 'update')).toHaveLength(0)
  })

  it('le prof propriétaire peut modifier puis supprimer son cours', async () => {
    const m = await request(app).patch('/api/ressources/100/visibilite').set(bearer(20)).send({ visible: false })
    expect(m.status).toBe(200)
    const d = await request(app).delete('/api/ressources/100').set(bearer(20))
    expect(d.status).toBe(200)
    expect(supprimes()).toHaveLength(1)
  })

  it("l'admin peut supprimer n'importe quel cours", async () => {
    const res = await request(app).delete('/api/ressources/100').set(bearer(30))
    expect(res.status).toBe(200)
  })

  it('ressource inexistante → 404', async () => {
    const res = await request(app).delete('/api/ressources/999').set(bearer(20))
    expect(res.status).toBe(404)
  })
})
