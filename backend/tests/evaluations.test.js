import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { PDFDocument } from 'pdf-lib'
import { resetDb, tables, stockage } from './helpers/supabaseMock.js'
import { bearer } from './helpers/tokens.js'

vi.mock('../supabase.js', async () => ({ default: (await import('./helpers/supabaseMock.js')).supabaseMock }))
// Le limiteur de dépôts (15 / 15 min / utilisateur) est neutralisé : ces tests déposent bien plus souvent
vi.mock('../middleware/rateLimit.js', async (importOriginal) => ({
  ...(await importOriginal()),
  depotLimiter: (req, res, next) => next()
}))

const { default: app } = await import('../app.js')
const { invalidateUserCache } = await import('../middleware/authMiddleware.js')
const { detecterType } = await import('../lib/fichiers.js')

// ── Jeu de données ──────────────────────────────────────────────────────────
const E = {
  ouverte: '11111111-1111-4111-8111-111111111111',
  retardOk: '22222222-2222-4222-8222-222222222222',
  retardKo: '33333333-3333-4333-8333-333333333333',
  futur: '44444444-4444-4444-8444-444444444444'
}
const jours = (n) => new Date(Date.now() + n * 86400_000).toISOString()
const evaluation = (id, extra) => ({
  id, concours_code: 'ensea', matiere: 'Mathématiques', titre: `Éval ${id.slice(0, 4)}`, consignes: 'Consignes',
  sujet_storage_path: 'ensea/sujet.pdf', date_ouverture: jours(-5), date_limite: jours(5), retard_autorise: true,
  competences: ['MA-ANA-1'], created_by: 20, ...extra
})
const user = (id, role) => ({ id, matricule: `M${id}`, username: `u${id}`, role, modalite: null, bloque: false })

const pdfValide = async (pages = 1) => {
  const doc = await PDFDocument.create()
  for (let i = 0; i < pages; i++) doc.addPage()
  return Buffer.from(await doc.save())
}
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==', 'base64')

const deposer = async (idEleve, idEval, fichiers) => {
  const req = request(app).post(`/api/evaluations/${idEval}/copie`).set(bearer(idEleve))
  for (const f of fichiers) req.attach('fichiers', f.buffer, { filename: f.nom, contentType: f.type })
  return req
}
const fichierPdf = async (nom = 'copie.pdf') => ({ buffer: await pdfValide(), nom, type: 'application/pdf' })

beforeEach(() => {
  invalidateUserCache()
  resetDb({
    users: [
      user(10, 'etudiant'), user(11, 'etudiant'), user(12, 'etudiant'),
      user(20, 'professeur'), user(21, 'professeur'), user(30, 'admin')
    ],
    inscriptions: [
      { user_id: 10, concours_code: 'ensea' }, { user_id: 11, concours_code: 'ensea' },
      { user_id: 12, concours_code: 'inphb' }, { user_id: 21, concours_code: 'inphb' }
    ],
    evaluations: [
      evaluation(E.ouverte),
      evaluation(E.retardOk, { date_ouverture: jours(-10), date_limite: jours(-1) }),
      evaluation(E.retardKo, { date_ouverture: jours(-10), date_limite: jours(-1), retard_autorise: false }),
      evaluation(E.futur, { date_ouverture: jours(3), date_limite: jours(10) })
    ]
  })
})

// ── Dépôt par l'élève ───────────────────────────────────────────────────────
describe('Dépôt de copie', () => {
  it('enregistre un PDF dans le bucket privé sans exposer de chemin', async () => {
    const r = await deposer(10, E.ouverte, [await fichierPdf()])
    expect(r.status).toBe(201)
    expect(r.body.copie.statut).toBe('deposee')
    expect(r.body.copie.en_retard).toBe(false)
    expect(JSON.stringify(r.body)).not.toMatch(/storage|\.pdf|path/)
    expect([...stockage.fichiers.keys()].some(k => k.startsWith('copies/'))).toBe(true)
  })

  it('fusionne PDF et images en un seul PDF', async () => {
    const r = await deposer(10, E.ouverte, [
      { buffer: PNG, nom: 'page1.png', type: 'image/png' },
      { buffer: await pdfValide(2), nom: 'suite.pdf', type: 'application/pdf' }
    ])
    expect(r.status).toBe(201)
    const [contenu] = [...stockage.fichiers.values()]
    expect((await PDFDocument.load(contenu)).getPageCount()).toBe(3)
    expect(tables.copies[0].fichiers).toHaveLength(1)
  })

  it('refuse un exécutable renommé en .pdf (vrai type vérifié)', async () => {
    const faux = { buffer: Buffer.concat([Buffer.from('MZ'), Buffer.alloc(200)]), nom: 'copie.pdf', type: 'application/pdf' }
    const r = await deposer(10, E.ouverte, [faux])
    expect(r.status).toBe(400)
    expect(stockage.fichiers.size).toBe(0)
    expect(tables.copies).toHaveLength(0)
  })

  it('refuse un PDF corrompu et plus de 10 fichiers', async () => {
    const casse = { buffer: Buffer.from('%PDF-1.4 ceci n’est pas un vrai pdf'), nom: 'x.pdf', type: 'application/pdf' }
    expect((await deposer(10, E.ouverte, [casse])).status).toBe(400)
    const onze = Array.from({ length: 11 }, (_, i) => ({ buffer: PNG, nom: `p${i}.png`, type: 'image/png' }))
    expect((await deposer(10, E.ouverte, onze)).status).toBe(400)
    expect(tables.copies).toHaveLength(0)
  })

  it('refuse un envoi vide', async () => {
    const r = await request(app).post(`/api/evaluations/${E.ouverte}/copie`).set(bearer(10))
    expect(r.status).toBe(400)
  })

  it('dépôt après la date limite : accepté et marqué en retard si autorisé', async () => {
    const r = await deposer(10, E.retardOk, [await fichierPdf()])
    expect(r.status).toBe(201)
    expect(r.body.copie.en_retard).toBe(true)
  })

  it('dépôt après la date limite : refusé (409) si le retard est interdit', async () => {
    const r = await deposer(10, E.retardKo, [await fichierPdf()])
    expect(r.status).toBe(409)
    expect(tables.copies).toHaveLength(0)
  })

  it('dépôt avant l’ouverture : refusé (403)', async () => {
    expect((await deposer(10, E.futur, [await fichierPdf()])).status).toBe(403)
  })

  it('un élève d’un autre concours ne voit pas l’évaluation (404)', async () => {
    expect((await deposer(12, E.ouverte, [await fichierPdf()])).status).toBe(404)
  })

  it('le personnel ne peut pas déposer de copie', async () => {
    expect((await deposer(20, E.ouverte, [await fichierPdf()])).status).toBe(403)
  })

  it('redépôt possible tant que non corrigée (remplace l’ancien fichier), impossible ensuite', async () => {
    const premier = await deposer(10, E.ouverte, [await fichierPdf()])
    expect(premier.status).toBe(201)
    const ancien = tables.copies[0].fichiers[0].path

    const second = await deposer(10, E.ouverte, [await fichierPdf()])
    expect(second.status).toBe(200)
    expect(tables.copies).toHaveLength(1)
    expect(stockage.suppressions).toContain(`copies/${ancien}`)

    tables.copies[0].statut = 'corrigee'
    expect((await deposer(10, E.ouverte, [await fichierPdf()])).status).toBe(409)
  })
})

// ── Accès aux copies et au sujet ────────────────────────────────────────────
describe('Accès aux fichiers (URL signées 5 min)', () => {
  let copieId
  beforeEach(async () => {
    await deposer(10, E.ouverte, [await fichierPdf()])
    copieId = tables.copies[0].id
  })

  it('l’auteur obtient une URL signée de 5 minutes', async () => {
    const r = await request(app).get(`/api/evaluations/copies/${copieId}/fichier`).set(bearer(10))
    expect(r.status).toBe(200)
    expect(r.body.url).toContain('ttl=300')
    expect(r.body.expire_dans).toBe(300)
  })

  it('un élève ne peut pas télécharger la copie d’un autre (403)', async () => {
    const r = await request(app).get(`/api/evaluations/copies/${copieId}/fichier`).set(bearer(11))
    expect(r.status).toBe(403)
    expect(stockage.urls).toHaveLength(0)
  })

  it('un professeur d’un autre concours est refusé (403), un professeur non rattaché accepté', async () => {
    expect((await request(app).get(`/api/evaluations/copies/${copieId}/fichier`).set(bearer(21))).status).toBe(403)
    expect((await request(app).get(`/api/evaluations/${E.ouverte}/copies`).set(bearer(21))).status).toBe(403)
    const ok = await request(app).get(`/api/evaluations/copies/${copieId}/fichier`).set(bearer(20))
    expect(ok.status).toBe(200)
    expect(tables.copies[0].statut).toBe('en_correction') // ouverture par le prof
  })

  it('identifiant invalide → 400', async () => {
    expect((await request(app).get('/api/evaluations/copies/pas-un-uuid/fichier').set(bearer(10))).status).toBe(400)
  })

  it('le sujet n’est pas téléchargeable avant l’ouverture (élève) mais l’est ensuite', async () => {
    expect((await request(app).get(`/api/evaluations/${E.futur}/sujet`).set(bearer(10))).status).toBe(403)
    const ok = await request(app).get(`/api/evaluations/${E.ouverte}/sujet`).set(bearer(10))
    expect(ok.status).toBe(200)
    expect(ok.body.url).toContain('sujets/')
    expect((await request(app).get(`/api/evaluations/${E.ouverte}/sujet`).set(bearer(12))).status).toBe(404)
  })
})

// ── Correction ──────────────────────────────────────────────────────────────
describe('Correction', () => {
  let copieId
  beforeEach(async () => {
    await deposer(10, E.ouverte, [await fichierPdf()])
    copieId = tables.copies[0].id
  })
  const corriger = (idProf, champs = {}, corrige) => {
    const r = request(app).put(`/api/evaluations/copies/${copieId}/correction`).set(bearer(idProf))
    for (const [k, v] of Object.entries({ note: '15,5', commentaire: 'Bien', ...champs })) r.field(k, v)
    if (corrige) r.attach('corrige', corrige.buffer, { filename: 'corrige.pdf', contentType: 'application/pdf' })
    return r
  }

  it('enregistre note + commentaire + corrigé annoté, et alimente la table notes', async () => {
    const r = await corriger(20, {}, await fichierPdf())
    expect(r.status).toBe(200)
    expect(tables.copies[0]).toMatchObject({ statut: 'corrigee', note: 15.5, commentaire: 'Bien', corrige_par: 20 })
    expect(tables.notes).toHaveLength(1)
    expect(tables.notes[0]).toMatchObject({ etudiant_id: 10, matiere: 'Mathématiques', concours: 'ENSEA', note: 15.5 })
    expect(tables.notes[0].periode).toContain('Évaluation')
  })

  it('une nouvelle correction met à jour la même note (pas de doublon)', async () => {
    await corriger(20)
    await corriger(20, { note: '17' })
    expect(tables.notes).toHaveLength(1)
    expect(tables.notes[0].note).toBe(17)
  })

  it('refuse une note hors 0–20 ou non numérique', async () => {
    expect((await corriger(20, { note: '21' })).status).toBe(400)
    expect((await corriger(20, { note: 'abc' })).status).toBe(400)
    expect(tables.notes).toHaveLength(0)
  })

  it('un élève ne peut pas corriger, un professeur d’un autre concours non plus', async () => {
    expect((await corriger(10)).status).toBe(403)
    expect((await corriger(21)).status).toBe(403)
    expect(tables.copies[0].statut).toBe('deposee')
  })

  it('l’élève voit sa note et son corrigé seulement une fois corrigée', async () => {
    const avant = await request(app).get('/api/evaluations/mes').set(bearer(10))
    const copieAvant = avant.body.evaluations.find(e => e.id === E.ouverte).copie
    expect(copieAvant.note).toBeNull()
    expect((await request(app).get(`/api/evaluations/copies/${copieId}/corrige`).set(bearer(10))).status).toBe(403)

    await corriger(20, {}, await fichierPdf())
    const apres = await request(app).get('/api/evaluations/mes').set(bearer(10))
    const ev = apres.body.evaluations.find(e => e.id === E.ouverte)
    expect(ev.etat).toBe('corrigee')
    expect(ev.copie).toMatchObject({ note: 15.5, commentaire: 'Bien', a_corrige: true })
    expect((await request(app).get(`/api/evaluations/copies/${copieId}/corrige`).set(bearer(10))).status).toBe(200)
    expect((await request(app).get(`/api/evaluations/copies/${copieId}/corrige`).set(bearer(11))).status).toBe(403)
  })
})

// ── « Mes évaluations » et création ─────────────────────────────────────────
describe('Mes évaluations et création', () => {
  it('classe les évaluations (à faire / déposée) et masque les consignes avant ouverture', async () => {
    await deposer(10, E.ouverte, [await fichierPdf()])
    const r = await request(app).get('/api/evaluations/mes').set(bearer(10))
    expect(r.status).toBe(200)
    const parId = Object.fromEntries(r.body.evaluations.map(e => [e.id, e]))
    expect(parId[E.ouverte].etat).toBe('deposee')
    expect(parId[E.retardOk].etat).toBe('a_faire')
    expect(parId[E.futur].consignes).toBeNull()
    expect(parId[E.futur].ouverte).toBe(false)
    expect(JSON.stringify(r.body)).not.toContain('sujet_storage_path')
  })

  it('un élève INP-HB ne voit aucune évaluation ENSEA', async () => {
    const r = await request(app).get('/api/evaluations/mes').set(bearer(12))
    expect(r.body.evaluations).toHaveLength(0)
  })

  const creer = (idProf, champs = {}, sujet) => {
    const r = request(app).post('/api/evaluations').set(bearer(idProf))
    const base = { concours_code: 'ensea', matiere: 'Français', titre: 'Résumé n°1', date_limite: jours(7), competences: 'FR-RES-1, FR-RES-4', ...champs }
    for (const [k, v] of Object.entries(base)) r.field(k, v)
    if (sujet) r.attach('sujet', sujet, { filename: 'sujet.pdf', contentType: 'application/pdf' })
    return r
  }

  it('un professeur crée une évaluation ENSEA avec son sujet PDF', async () => {
    const r = await creer(20, {}, await pdfValide())
    expect(r.status).toBe(201)
    expect(r.body.evaluation.competences).toEqual(['FR-RES-1', 'FR-RES-4'])
    expect(r.body.evaluation.sujet_storage_path).toBeUndefined()
    expect([...stockage.fichiers.keys()].some(k => k.startsWith('sujets/'))).toBe(true)
  })

  it('refuse matière hors ENSEA, compétence invalide, doublon, élève, prof d’un autre concours', async () => {
    expect((await creer(20, { matiere: 'Physique' })).status).toBe(400)
    expect((await creer(20, { competences: 'nimporte quoi' })).status).toBe(400)
    expect((await creer(20, { date_limite: jours(-1) })).status).toBe(400)
    expect((await creer(10)).status).toBe(403)
    expect((await creer(21)).status).toBe(403)
    expect((await creer(20)).status).toBe(201)
    expect((await creer(20)).status).toBe(409)
  })
})

describe('lib/fichiers', () => {
  it('reconnaît PDF, JPEG et PNG par leurs premiers octets', async () => {
    expect(detecterType(await pdfValide())).toBe('pdf')
    expect(detecterType(PNG)).toBe('png')
    expect(detecterType(Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(20)]))).toBe('jpeg')
    expect(detecterType(Buffer.concat([Buffer.from('MZ'), Buffer.alloc(30)]))).toBeNull()
    expect(detecterType(Buffer.from('<script>alert(1)</script>'))).toBeNull()
  })
})

// ── Cartes de /outils/evaluations ───────────────────────────────────────────
describe('Résumé des évaluations par concours', () => {
  const codes = (r) => r.body.concours.map(c => c.code)

  beforeEach(() => {
    tables.ressources.push(
      { id: 1, titre: 'PDF INP-HB', concours: 'INP-HB', visible: true, est_evaluation: true },
      { id: 2, titre: 'PDF pour tous', concours: 'tous', visible: true, est_evaluation: true }
    )
  })

  it('un élève ENSEA seul ne reçoit que la carte ENSEA, avec ses évaluations à faire', async () => {
    const r = await request(app).get('/api/evaluations/resume').set(bearer(10))
    expect(r.status).toBe(200)
    expect(codes(r)).toEqual(['ensea'])
    // ouverte, retardOk, retardKo sont ouvertes ; futur ne l'est pas
    expect(r.body.concours[0]).toMatchObject({ total: 4, a_faire: 3, generation_auto_tests: false })
  })

  it('compte « à rendre » seulement les échéances dans les 3 jours', async () => {
    tables.evaluations.push(evaluation('55555555-5555-4555-8555-555555555555', { date_limite: jours(2) }))
    const r = await request(app).get('/api/evaluations/resume').set(bearer(10))
    expect(r.body.concours[0].a_rendre).toBe(1)
  })

  it('un élève INP-HB ne voit pas ENSEA et ne compte que ses PDF', async () => {
    const r = await request(app).get('/api/evaluations/resume').set(bearer(12))
    expect(codes(r)).toEqual(['inphb'])
    // pas de suivi « à faire » pour les PDF : seul le total est renvoyé
    expect(r.body.concours[0]).toMatchObject({ total: 2, a_faire: 0, a_rendre: 0, generation_auto_tests: true })
  })

  it('un élève INP-HB + ESATIC ne reçoit jamais ENSEA', async () => {
    tables.inscriptions.push({ user_id: 12, concours_code: 'esatic' })
    invalidateUserCache()
    const r = await request(app).get('/api/evaluations/resume').set(bearer(12))
    expect(codes(r)).toEqual(['inphb', 'esatic'])
  })

  it('un administrateur voit tous les concours', async () => {
    const r = await request(app).get('/api/evaluations/resume').set(bearer(30))
    expect(codes(r)).toEqual(['inphb', 'esatic', 'cme', 'ensea'])
  })

  it('/api/ressources/evaluations?concours= refuse un concours non inscrit', async () => {
    expect((await request(app).get('/api/ressources/evaluations?concours=ensea').set(bearer(12))).status).toBe(403)
    expect((await request(app).get('/api/ressources/evaluations?concours=zzz').set(bearer(12))).status).toBe(400)
    const ok = await request(app).get('/api/ressources/evaluations?concours=inphb').set(bearer(12))
    expect(ok.body.ressources).toHaveLength(2)
  })
})
