import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { PDFDocument } from 'pdf-lib'
import { resetDb, tables, stockage } from './helpers/supabaseMock.js'
import { bearer } from './helpers/tokens.js'

vi.mock('../supabase.js', async () => ({ default: (await import('./helpers/supabaseMock.js')).supabaseMock }))

const { default: app } = await import('../app.js')
const { invalidateUserCache } = await import('../middleware/authMiddleware.js')
const { viderCacheOptions } = await import('../lib/inscriptions.js')

// ── Jeu de données ──────────────────────────────────────────────────────────
const C1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1' // Français
const C2 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2' // Mathématiques
const EX = { facile: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1', moyen: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2', difficile: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3' }
const SEANCE = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'
const heures = (n) => new Date(Date.now() + n * 3600_000).toISOString()
const user = (id, role) => ({ id, matricule: `M${id}`, username: `u${id}`, nom: `N${id}`, prenom: `P${id}`, role, modalite: null, bloque: false })
const competence = (id, code, matiere) => ({ id, concours_code: 'ensea', matiere, code, libelle: `Libellé ${code}`, ordre: 1, url: null, actif: true })
const exercice = (id, niveau, extra) => ({ id, concours_code: 'ensea', competence_id: C2, titre: `Exercice ${niveau}`, fichier_path: `ensea/${C2}/${niveau}.pdf`, niveau, actif: true, created_by: 20, created_at: heures(-100), ...extra })

const donnees = (options = {}, extra = {}) => ({
  users: [user(10, 'etudiant'), user(11, 'etudiant'), user(12, 'etudiant'), user(20, 'professeur'), user(21, 'professeur'), user(30, 'admin')],
  inscriptions: [
    { user_id: 10, concours_code: 'ensea' }, { user_id: 11, concours_code: 'ensea' },
    { user_id: 12, concours_code: 'inphb' }, { user_id: 21, concours_code: 'inphb' }
  ],
  concours: [{ code: 'ensea', nom: 'ENSEA', actif: true, options }],
  competences: [competence(C1, 'FR-RES-1', 'Français'), competence(C2, 'MA-ANA-1', 'Mathématiques')],
  exercices_renforcement: [exercice(EX.facile, 'facile'), exercice(EX.moyen, 'moyen'), exercice(EX.difficile, 'difficile')],
  ...extra
})

const lier = (periode, ids = [C2], idProf = 20) =>
  request(app).put('/api/notes/competences').set(bearer(idProf)).send({ concours: 'ensea', matiere: 'Mathématiques', periode, competence_ids: ids })
const noter = (etudiant, note, periode = 'Nov 2026') =>
  request(app).post('/api/notes/ajouter').set(bearer(20)).send({ etudiant_id: etudiant, matiere: 'Mathématiques', concours: 'ENSEA', note, periode })
const scoreDe = (etudiant, competence = C2) => tables.scores_competences.find(s => String(s.etudiant_id) === String(etudiant) && s.competence_id === competence)

beforeEach(() => { invalidateUserCache(); viderCacheOptions(); resetDb(donnees()) })

// ── Calcul enregistré et recalcul ───────────────────────────────────────────
describe('Score enregistré et recalculé', () => {
  it('une note rattachée à la compétence donne un score définitif (note / 20 × 100) et un historique', async () => {
    expect((await lier('Nov 2026')).status).toBe(200)
    expect((await noter(10, 4)).status).toBe(200)
    expect(scoreDe(10)).toMatchObject({ score: 20, provisoire: false, nb_notes: 1, nb_autoeval: 0 })
    expect(tables.scores_historique).toHaveLength(1)

    // une 2e note recalcule : (4×1 + 16×2) / 3 = 12 → 60
    await lier('Dec 2026')
    await noter(10, 16, 'Dec 2026')
    expect(scoreDe(10).score).toBe(60)
    expect(tables.scores_historique).toHaveLength(2)
  })

  it('une note non rattachée à une compétence ne produit aucun score', async () => {
    await noter(10, 4)
    expect(tables.scores_competences).toHaveLength(0)
  })

  it('l’auto-évaluation seule donne un score provisoire, jamais d’envoi même en mode AUTO', async () => {
    resetDb(donnees({ renforcement_mode: 'auto' }, {
      seances: [{ id: SEANCE, concours_code: 'ensea', titre: 'S1', debut: heures(-5), fin: heures(-3), meeting_id: null }],
      seance_competences: [{ seance_id: SEANCE, competence_id: C2 }]
    }))
    const r = await request(app).post('/api/auto-eval').set(bearer(10)).send({ seance_id: SEANCE, reponses: [{ competence_id: C2, niveau: 0 }] })
    expect(r.status).toBe(201)
    expect(scoreDe(10)).toMatchObject({ score: 0, provisoire: true, nb_autoeval: 1, nb_notes: 0 })
    expect(tables.exercices).toHaveLength(0)
  })

  it('mélange auto-évaluation et notes avec α = 0,3 (0,3 × 100 + 0,7 × 50 = 65)', async () => {
    resetDb(donnees({}, {
      seances: [{ id: SEANCE, concours_code: 'ensea', titre: 'S1', debut: heures(-5), fin: heures(-3), meeting_id: null }],
      seance_competences: [{ seance_id: SEANCE, competence_id: C2 }]
    }))
    await lier('Nov 2026')
    await noter(10, 10)
    await request(app).post('/api/auto-eval').set(bearer(10)).send({ seance_id: SEANCE, reponses: [{ competence_id: C2, niveau: 5 }] })
    expect(scoreDe(10)).toMatchObject({ score: 65, provisoire: false, nb_notes: 1, nb_autoeval: 1 })
  })

  it('α modifiable par l’admin : α = 1 ne retient que l’auto-évaluation', async () => {
    resetDb(donnees({}, {
      seances: [{ id: SEANCE, concours_code: 'ensea', titre: 'S1', debut: heures(-5), fin: heures(-3), meeting_id: null }],
      seance_competences: [{ seance_id: SEANCE, competence_id: C2 }]
    }))
    await lier('Nov 2026')
    await noter(10, 10)
    await request(app).post('/api/auto-eval').set(bearer(10)).send({ seance_id: SEANCE, reponses: [{ competence_id: C2, niveau: 5 }] })
    expect((await request(app).patch('/api/concours/ensea/options').set(bearer(20)).send({ score_alpha: 1 })).status).toBe(403)
    expect((await request(app).patch('/api/concours/ensea/options').set(bearer(30)).send({ score_alpha: 1 })).status).toBe(200)
    expect(scoreDe(10).score).toBe(100) // recalculé automatiquement
    expect((await request(app).patch('/api/concours/ensea/options').set(bearer(30)).send({ score_alpha: 3 })).status).toBe(400)
  })

  it('la correction d’une évaluation papier rattache ses compétences à la note et calcule le score', async () => {
    resetDb(donnees({}, {
      evaluations: [{ id: '11111111-1111-4111-8111-111111111111', concours_code: 'ensea', matiere: 'Mathématiques', titre: 'Devoir 1', competences: ['MA-ANA-1'], date_ouverture: heures(-50), date_limite: heures(-10), retard_autorise: true }],
      copies: [{ id: '22222222-2222-4222-8222-222222222222', evaluation_id: '11111111-1111-4111-8111-111111111111', etudiant_id: 10, fichiers: [], statut: 'deposee', corrige_storage_path: null }]
    }))
    const r = await request(app).put('/api/evaluations/copies/22222222-2222-4222-8222-222222222222/correction').set(bearer(20)).field('note', '6')
    expect(r.status).toBe(200)
    expect(tables.notes_competences).toHaveLength(1)
    expect(scoreDe(10)).toMatchObject({ score: 30, provisoire: false })
  })

  it('rattachement refusé pour une compétence d’une autre matière, ou par un professeur d’un autre concours', async () => {
    expect((await lier('Nov 2026', [C1])).status).toBe(400) // C1 est une compétence de Français
    expect((await lier('Nov 2026', [C2], 21)).status).toBe(403)
    expect(tables.notes_competences).toHaveLength(0)
  })
})

// ── Renforcement : mode MANUEL ──────────────────────────────────────────────
describe('Renforcement — mode manuel (par défaut)', () => {
  beforeEach(async () => { await lier('Nov 2026'); await noter(10, 4) })

  it('rien n’est envoyé automatiquement ; l’élève apparaît dans « en difficulté »', async () => {
    expect(tables.exercices).toHaveLength(0)
    const r = await request(app).get('/api/renforcement/difficultes?concours=ensea').set(bearer(20))
    expect(r.status).toBe(200)
    expect(r.body.parametres).toMatchObject({ alpha: 0.3, seuil: 50, mode: 'manuel' })
    expect(r.body.difficultes).toHaveLength(1)
    expect(r.body.difficultes[0]).toMatchObject({ score: 20, peut_envoyer: true })
    expect(r.body.difficultes[0].exercice_suggere.niveau).toBe('facile')
    expect(r.body.difficultes[0].historique).toHaveLength(1)
  })

  it('tri du plus faible au plus fort', async () => {
    await noter(11, 8)
    const r = await request(app).get('/api/renforcement/difficultes?concours=ensea').set(bearer(20))
    expect(r.body.difficultes.map(d => d.score)).toEqual([20, 40])
  })

  it('un score au-dessus du seuil n’apparaît pas', async () => {
    await noter(11, 10) // 50 : pas strictement sous le seuil
    const r = await request(app).get('/api/renforcement/difficultes?concours=ensea').set(bearer(20))
    expect(r.body.difficultes).toHaveLength(1)
  })

  it('envoi en un clic : ligne dans exercices + message ; pas de doublon dans les 7 jours', async () => {
    const corps = { etudiant_id: 10, competence_id: C2 }
    const ok = await request(app).post('/api/renforcement/envoyer').set(bearer(20)).send(corps)
    expect(ok.status).toBe(201)
    expect(tables.exercices).toHaveLength(1)
    expect(tables.exercices[0]).toMatchObject({ etudiant_id: 10, competence_id: C2, renforcement_id: EX.facile, envoye_par_mode: 'manuel', professeur_id: 20 })
    expect(tables.messages).toHaveLength(1)
    expect(tables.messages[0]).toMatchObject({ a_id: 10, de_id: 20 })

    const doublon = await request(app).post('/api/renforcement/envoyer').set(bearer(20)).send(corps)
    expect(doublon.status).toBe(409)
    expect(tables.exercices).toHaveLength(1)

    // après 8 jours, l’exercice suivant (non encore reçu) peut être envoyé
    tables.exercices[0].created_at = heures(-8 * 24)
    const suite = await request(app).post('/api/renforcement/envoyer').set(bearer(20)).send(corps)
    expect(suite.status).toBe(201)
    expect(tables.exercices[1].renforcement_id).toBe(EX.moyen)
  })

  it('refuse : élève, professeur d’un autre concours, aucun exercice disponible', async () => {
    const corps = { etudiant_id: 10, competence_id: C2 }
    expect((await request(app).post('/api/renforcement/envoyer').set(bearer(10)).send(corps)).status).toBe(403)
    expect((await request(app).post('/api/renforcement/envoyer').set(bearer(21)).send(corps)).status).toBe(404)
    expect((await request(app).get('/api/renforcement/difficultes?concours=ensea').set(bearer(21))).status).toBe(403)
    expect((await request(app).get('/api/renforcement/difficultes?concours=ensea').set(bearer(10))).status).toBe(403)

    tables.exercices_renforcement.length = 0
    expect((await request(app).post('/api/renforcement/envoyer').set(bearer(20)).send(corps)).status).toBe(409)
  })
})

// ── Renforcement : mode AUTO ────────────────────────────────────────────────
describe('Renforcement — mode automatique', () => {
  beforeEach(() => { resetDb(donnees({ renforcement_mode: 'auto' })) })

  it('envoie immédiatement un exercice non encore reçu, avec notification, sous le seuil', async () => {
    await lier('Nov 2026')
    await noter(10, 4)
    expect(tables.exercices).toHaveLength(1)
    expect(tables.exercices[0]).toMatchObject({ renforcement_id: EX.facile, envoye_par_mode: 'auto', etudiant_id: 10, professeur_id: 20 })
    expect(tables.messages).toHaveLength(1)
  })

  it('pas de 2e envoi dans les 7 jours, puis l’exercice suivant après', async () => {
    await lier('Nov 2026'); await lier('Dec 2026'); await lier('Jan 2027')
    await noter(10, 4)
    await noter(10, 3, 'Dec 2026')          // nouveau calcul, toujours sous le seuil, mais envoi < 7 jours
    expect(tables.exercices).toHaveLength(1)

    tables.exercices[0].created_at = heures(-8 * 24)
    await noter(10, 2, 'Jan 2027')
    expect(tables.exercices).toHaveLength(2)
    expect(tables.exercices.map(e => e.renforcement_id)).toEqual([EX.facile, EX.moyen])
  })

  it('aucun envoi pour un score au-dessus du seuil', async () => {
    await lier('Nov 2026')
    await noter(10, 15)
    expect(tables.exercices).toHaveLength(0)
  })

  it('changer le seuil recalcule les scores mais n’envoie rien en masse', async () => {
    resetDb(donnees({ renforcement_mode: 'manuel' }))
    await lier('Nov 2026')
    await noter(10, 12) // 60 : au-dessus du seuil de 50
    await request(app).patch('/api/concours/ensea/options').set(bearer(30)).send({ renforcement_mode: 'auto' })
    viderCacheOptions()
    await request(app).patch('/api/concours/ensea/options').set(bearer(30)).send({ score_seuil: 80 })
    expect(scoreDe(10).score).toBe(60)
    expect(tables.exercices).toHaveLength(0) // sous le nouveau seuil, mais aucun envoi lors d'un recalcul en masse
  })
})

// ── Espace élève ────────────────────────────────────────────────────────────
describe('Espace élève', () => {
  beforeEach(async () => {
    resetDb(donnees({ renforcement_mode: 'auto' }))
    await lier('Nov 2026')
    await noter(10, 4)
  })

  it('« Mes compétences » : scores, compétences à renforcer, exercices recommandés', async () => {
    const r = await request(app).get('/api/renforcement/mes-competences').set(bearer(10))
    expect(r.status).toBe(200)
    const maths = r.body.competences.find(c => c.code === 'MA-ANA-1')
    expect(maths).toMatchObject({ score: 20, provisoire: false, a_renforcer: true, seuil: 50 })
    expect(r.body.competences.find(c => c.code === 'FR-RES-1')).toMatchObject({ score: null, a_renforcer: false })
    expect(r.body.exercices).toHaveLength(1)
    expect(JSON.stringify(r.body)).not.toMatch(/fichier_path|\.pdf/)
  })

  it('un élève d’un autre concours n’a ni compétence ni accès', async () => {
    const r = await request(app).get('/api/renforcement/mes-competences').set(bearer(12))
    expect(r.body.competences).toHaveLength(0)
    expect((await request(app).get('/api/renforcement/mes-competences').set(bearer(20))).status).toBe(403)
  })

  it('téléchargement par lien signé de 5 minutes, réservé au destinataire', async () => {
    const id = tables.exercices[0].id
    const ok = await request(app).get(`/api/renforcement/envoyes/${id}/fichier`).set(bearer(10))
    expect(ok.status).toBe(200)
    expect(ok.body.url).toContain('ttl=300')
    expect((await request(app).get(`/api/renforcement/envoyes/${id}/fichier`).set(bearer(11))).status).toBe(404)
  })
})

// ── Bibliothèque d'exercices (professeurs) ──────────────────────────────────
describe('Bibliothèque d’exercices de renforcement', () => {
  const pdf = async () => { const d = await PDFDocument.create(); d.addPage(); return Buffer.from(await d.save()) }
  const ajouter = async (idProf, extra = {}) => {
    const r = request(app).post('/api/renforcement/exercices').set(bearer(idProf))
    for (const [k, v] of Object.entries({ competence_id: C1, titre: 'Série 1', niveau: 'facile', ...extra })) r.field(k, v)
    return r.attach('fichier', await pdf(), { filename: 'serie.pdf', contentType: 'application/pdf' })
  }

  it('un professeur ajoute un exercice (PDF dans un bucket privé, sans chemin renvoyé)', async () => {
    const r = await ajouter(20)
    expect(r.status).toBe(201)
    expect(r.body.exercice.fichier_path).toBeUndefined()
    expect([...stockage.fichiers.keys()].some(k => k.startsWith('exercices_renforcement/'))).toBe(true)
    const liste = await request(app).get('/api/renforcement/exercices?concours=ensea').set(bearer(20))
    expect(JSON.stringify(liste.body)).not.toContain('fichier_path')
    expect(liste.body.exercices.some(e => e.titre === 'Série 1')).toBe(true)
  })

  it('refuse : élève, professeur d’un autre concours, faux PDF, niveau invalide, sans fichier', async () => {
    expect((await ajouter(10)).status).toBe(403)
    expect((await ajouter(21)).status).toBe(403)
    expect((await ajouter(20, { niveau: 'expert' })).status).toBe(400)
    const faux = await request(app).post('/api/renforcement/exercices').set(bearer(20))
      .field('competence_id', C1).field('titre', 'X').attach('fichier', Buffer.concat([Buffer.from('MZ'), Buffer.alloc(40)]), { filename: 'a.pdf', contentType: 'application/pdf' })
    expect(faux.status).toBe(400)
    const sans = await request(app).post('/api/renforcement/exercices').set(bearer(20)).field('competence_id', C1).field('titre', 'X')
    expect(sans.status).toBe(400)
  })

  it('désactiver un exercice le retire des suggestions', async () => {
    const r = await request(app).patch(`/api/renforcement/exercices/${EX.facile}`).set(bearer(20)).send({ actif: false })
    expect(r.status).toBe(200)
    await lier('Nov 2026'); await noter(10, 4)
    const d = await request(app).get('/api/renforcement/difficultes?concours=ensea').set(bearer(20))
    expect(d.body.difficultes[0].exercice_suggere.niveau).toBe('moyen')
  })
})
