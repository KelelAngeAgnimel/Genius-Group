import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { resetDb, tables } from './helpers/supabaseMock.js'
import { bearer } from './helpers/tokens.js'

vi.mock('../supabase.js', async () => ({ default: (await import('./helpers/supabaseMock.js')).supabaseMock }))

const { default: app } = await import('../app.js')
const { invalidateUserCache } = await import('../middleware/authMiddleware.js')
const { viderCacheOptions } = await import('../lib/inscriptions.js')
const { etatSeance, reglesAutoEval } = await import('../lib/autoeval.js')

// ── Jeu de données ──────────────────────────────────────────────────────────
const C1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'
const C2 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'
const C3 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'
const S = { recente: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', rappel: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', ancienne: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3', future: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4' }
const heures = (n) => new Date(Date.now() + n * 3600_000).toISOString()
const user = (id, role) => ({ id, matricule: `M${id}`, username: `u${id}`, nom: `N${id}`, prenom: `P${id}`, role, modalite: null, bloque: false })
const competence = (id, code, matiere, ordre) => ({ id, concours_code: 'ensea', matiere, code, libelle: `Libellé ${code}`, ordre, url: null, actif: true })
const seance = (id, finH) => ({ id, concours_code: 'ensea', titre: `Séance ${id.slice(-1)}`, debut: heures(finH - 2), fin: heures(finH), meeting_id: null })

const base = (extra = {}) => ({
  users: [
    user(10, 'etudiant'), user(11, 'etudiant'), user(12, 'etudiant'),
    user(20, 'professeur'), user(21, 'professeur'), user(30, 'admin')
  ],
  inscriptions: [
    { user_id: 10, concours_code: 'ensea' }, { user_id: 11, concours_code: 'ensea' },
    { user_id: 12, concours_code: 'inphb' }, { user_id: 21, concours_code: 'inphb' }
  ],
  concours: [{ code: 'ensea', nom: 'ENSEA', actif: true, options: { generation_auto_tests: false } }],
  competences: [competence(C1, 'FR-RES-1', 'Français', 1), competence(C2, 'MA-ANA-1', 'Mathématiques', 1), competence(C3, 'MA-GEO-1', 'Mathématiques', 2)],
  ...extra
})
const avecSeance = (id, finH, comps = [C1, C2]) => ({
  seances: [seance(id, finH)],
  seance_competences: comps.map(c => ({ seance_id: id, competence_id: c }))
})

beforeEach(() => { invalidateUserCache(); viderCacheOptions(); resetDb(base()) })

// ── Règles pures ────────────────────────────────────────────────────────────
describe('etatSeance (48 h pour répondre, rappel à 24 h)', () => {
  const regles = reglesAutoEval({}, 'ensea')
  const etat = (finH, extra = {}) => etatSeance({ fin: heures(finH), nbCompetences: 2, nbReponses: 0, debloque: false, ...extra }, regles)

  it('séance à venir, sans compétence, ou déjà faite : rien à faire', () => {
    expect(etat(+1).etat).toBe('a_venir')
    expect(etat(-1, { nbCompetences: 0 }).etat).toBe('sans_competence')
    expect(etat(-100, { nbReponses: 2 }).etat).toBe('faite')
  })
  it('juste après la séance : en attente, ni rappel ni verrou', () => {
    expect(etat(-1)).toMatchObject({ etat: 'en_attente', rappel: false, verrouille: false })
  })
  it('après 24 h : rappel, pas encore de verrou', () => {
    expect(etat(-25)).toMatchObject({ rappel: true, verrouille: false })
  })
  it('après 48 h : verrouillé, sauf déblocage manuel', () => {
    expect(etat(-49)).toMatchObject({ rappel: true, verrouille: true })
    expect(etat(-49, { debloque: true }).verrouille).toBe(false)
  })
  it('hors ENSEA, non bloquant par défaut', () => {
    const r = etatSeance({ fin: heures(-100), nbCompetences: 1, nbReponses: 0 }, reglesAutoEval({}, 'inphb'))
    expect(r.verrouille).toBe(false)
  })
})

// ── Référentiel de compétences ──────────────────────────────────────────────
describe('Compétences', () => {
  it('un élève ENSEA voit le référentiel ENSEA, pas un élève INP-HB', async () => {
    const ok = await request(app).get('/api/competences').set(bearer(10))
    expect(ok.body.competences.map(c => c.code)).toEqual(['FR-RES-1', 'MA-ANA-1', 'MA-GEO-1'])
    const non = await request(app).get('/api/competences').set(bearer(12))
    expect(non.body.competences).toHaveLength(0)
  })

  it('seul l’admin crée, modifie, importe', async () => {
    const corps = { concours_code: 'ensea', matiere: 'Français', code: 'FR-RES-9', libelle: 'Nouvelle' }
    expect((await request(app).post('/api/competences').set(bearer(20)).send(corps)).status).toBe(403)
    expect((await request(app).post('/api/competences').set(bearer(30)).send(corps)).status).toBe(201)
    expect((await request(app).post('/api/competences').set(bearer(30)).send(corps)).status).toBe(409)
    expect((await request(app).post('/api/competences').set(bearer(30)).send({ ...corps, code: 'mauvais' })).status).toBe(400)
  })

  it('import CSV : aperçu sans écriture, erreurs signalées, puis application', async () => {
    const lignes = [
      { matiere: 'Français', code: 'FR-RES-1', libelle: 'Libellé corrigé', ordre: '1' },        // existe : mise à jour
      { matiere: 'Mathématiques', code: 'MA-ALG-1', libelle: 'Algèbre', ordre: '5', url: 'https://exemple.ci/algebre' }, // nouvelle
      { matiere: 'Mathématiques', code: 'MA-ALG-1', libelle: 'Doublon' },                       // doublon dans le fichier
      { matiere: '', code: 'xx', libelle: 'Invalide' }
    ]
    const apercu = await request(app).post('/api/competences/import').set(bearer(30)).send({ concours_code: 'ensea', lignes, confirmer: false })
    expect(apercu.status).toBe(200)
    expect(apercu.body.appliquee).toBe(false)
    expect(apercu.body.erreurs).toHaveLength(2)
    expect(apercu.body).toMatchObject({ ajouts: 1, mises_a_jour: 1 })

    // des erreurs empêchent l'application, même avec confirmer
    const refuse = await request(app).post('/api/competences/import').set(bearer(30)).send({ concours_code: 'ensea', lignes, confirmer: true })
    expect(refuse.body.appliquee).toBe(false)
    expect(tables.competences).toHaveLength(3)

    const propres = lignes.slice(0, 2)
    const ok = await request(app).post('/api/competences/import').set(bearer(30)).send({ concours_code: 'ensea', lignes: propres, confirmer: true })
    expect(ok.body.appliquee).toBe(true)
    expect(tables.competences).toHaveLength(4)
    expect(tables.competences.find(c => c.code === 'FR-RES-1').libelle).toBe('Libellé corrigé')
    expect((await request(app).post('/api/competences/import').set(bearer(20)).send({ concours_code: 'ensea', lignes: propres })).status).toBe(403)
  })

  it('supprimer une compétence déjà utilisée la désactive seulement', async () => {
    resetDb(base(avecSeance(S.recente, -1)))
    const r = await request(app).delete(`/api/competences/${C1}`).set(bearer(30))
    expect(r.body.desactivee).toBe(true)
    expect(tables.competences.find(c => c.id === C1).actif).toBe(false)
    const libre = await request(app).delete(`/api/competences/${C3}`).set(bearer(30))
    expect(libre.body.desactivee).toBe(false)
    expect(tables.competences.find(c => c.id === C3)).toBeUndefined()
  })
})

// ── Séances ─────────────────────────────────────────────────────────────────
describe('Séances', () => {
  const corps = (extra = {}) => ({ concours_code: 'ensea', titre: 'Limites', debut: heures(-3), fin: heures(-1), competence_ids: [C2], ...extra })

  it('un professeur crée une séance avec ses compétences', async () => {
    const r = await request(app).post('/api/seances').set(bearer(20)).send(corps())
    expect(r.status).toBe(201)
    expect(tables.seance_competences).toHaveLength(1)
  })

  it('refuse : élève, professeur d’un autre concours, compétence inconnue, fin avant début', async () => {
    expect((await request(app).post('/api/seances').set(bearer(10)).send(corps())).status).toBe(403)
    expect((await request(app).post('/api/seances').set(bearer(21)).send(corps())).status).toBe(403)
    expect((await request(app).post('/api/seances').set(bearer(20)).send(corps({ competence_ids: ['cccccccc-cccc-4ccc-8ccc-cccccccccccc'] }))).status).toBe(400)
    expect((await request(app).post('/api/seances').set(bearer(20)).send(corps({ fin: heures(-5) }))).status).toBe(400)
    expect(tables.seances).toHaveLength(0)
  })

  it('un professeur d’un autre concours ne voit pas les séances ENSEA', async () => {
    resetDb(base(avecSeance(S.recente, -1)))
    expect((await request(app).get('/api/seances').set(bearer(20))).body.seances).toHaveLength(1)
    expect((await request(app).get('/api/seances').set(bearer(21))).body.seances).toHaveLength(0)
    expect((await request(app).get(`/api/seances/${S.recente}/suivi`).set(bearer(21))).status).toBe(404)
  })
})

// ── Auto-évaluation ─────────────────────────────────────────────────────────
describe('Auto-évaluation', () => {
  const envoyer = (id, seanceId, reponses) =>
    request(app).post('/api/auto-eval').set(bearer(id)).send({ seance_id: seanceId, reponses })

  it('GET /en-attente liste la séance terminée, sans rappel ni verrou juste après', async () => {
    resetDb(base(avecSeance(S.recente, -1)))
    const r = await request(app).get('/api/auto-eval/en-attente').set(bearer(10))
    expect(r.status).toBe(200)
    expect(r.body.en_attente).toHaveLength(1)
    expect(r.body).toMatchObject({ rappel: false, verrouille: false })
    expect(r.body.en_attente[0].competences.map(c => c.code)).toEqual(['FR-RES-1', 'MA-ANA-1'])
  })

  it('rien en attente pour une séance à venir ou pour un élève d’un autre concours', async () => {
    resetDb(base(avecSeance(S.future, +5)))
    expect((await request(app).get('/api/auto-eval/en-attente').set(bearer(10))).body.en_attente).toHaveLength(0)
    resetDb(base(avecSeance(S.recente, -1)))
    expect((await request(app).get('/api/auto-eval/en-attente').set(bearer(12))).body.en_attente).toHaveLength(0)
  })

  it('enregistre toutes les compétences, puis la séance n’est plus en attente', async () => {
    resetDb(base(avecSeance(S.recente, -1)))
    const r = await envoyer(10, S.recente, [{ competence_id: C1, niveau: 4 }, { competence_id: C2, niveau: 0, commentaire: 'Difficile' }])
    expect(r.status).toBe(201)
    expect(tables.auto_evaluations).toHaveLength(2)
    expect((await request(app).get('/api/auto-eval/en-attente').set(bearer(10))).body.en_attente).toHaveLength(0)
  })

  it('refuse : compétence manquante, hors séance, niveau invalide, doublon, séance à venir, autre concours', async () => {
    resetDb(base({ ...avecSeance(S.recente, -1), ...{} }))
    expect((await envoyer(10, S.recente, [{ competence_id: C1, niveau: 3 }])).status).toBe(400)        // il manque C2
    expect((await envoyer(10, S.recente, [{ competence_id: C1, niveau: 3 }, { competence_id: C3, niveau: 3 }])).status).toBe(400) // C3 étrangère
    expect((await envoyer(10, S.recente, [{ competence_id: C1, niveau: 6 }, { competence_id: C2, niveau: 3 }])).status).toBe(400)
    expect((await envoyer(10, S.recente, [{ competence_id: C1, niveau: 3 }, { competence_id: C1, niveau: 2 }])).status).toBe(400)
    expect((await envoyer(12, S.recente, [{ competence_id: C1, niveau: 3 }, { competence_id: C2, niveau: 3 }])).status).toBe(404)
    expect(tables.auto_evaluations).toHaveLength(0)

    expect((await envoyer(10, S.recente, [{ competence_id: C1, niveau: 3 }, { competence_id: C2, niveau: 3 }])).status).toBe(201)
    expect((await envoyer(10, S.recente, [{ competence_id: C1, niveau: 1 }, { competence_id: C2, niveau: 1 }])).status).toBe(409)

    resetDb(base(avecSeance(S.future, +5)))
    expect((await envoyer(10, S.future, [{ competence_id: C1, niveau: 3 }, { competence_id: C2, niveau: 3 }])).status).toBe(403)
  })
})

// ── Verrouillage et déblocage ───────────────────────────────────────────────
describe('Verrouillage après 48 h', () => {
  const ressourceEnsea = { id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1', titre: 'Annale', concours: 'ENSEA', visible: true, est_evaluation: false, storage_path: 'ensea/a.pdf' }
  const donnees = (finH) => base({
    ...avecSeance(S.ancienne, finH),
    meetings: [
      { id: 1, titre: 'Cours ENSEA', concours: 'ensea', lien: 'https://teams.test/ensea', created_at: heures(-9) },
      { id: 2, titre: 'Cours INP-HB', concours: 'inphb', lien: 'https://teams.test/inphb', created_at: heures(-8) },
      { id: 3, titre: 'Cours commun', concours: 'both', lien: 'https://teams.test/commun', created_at: heures(-7) }
    ],
    ressources: [ressourceEnsea]
  })
  const liens = async (id) => Object.fromEntries((await request(app).get('/api/meetings').set(bearer(id))).body.map(m => [m.id, m.lien]))

  it('moins de 48 h : tout reste accessible', async () => {
    resetDb(donnees(-30))
    expect((await liens(10))[1]).toBe('https://teams.test/ensea')
    const r = await request(app).get('/api/auto-eval/en-attente').set(bearer(10))
    expect(r.body).toMatchObject({ rappel: true, verrouille: false })
  })

  it('plus de 48 h : le lien du cours ENSEA est masqué et la ressource ENSEA refusée', async () => {
    resetDb(donnees(-50))
    const l = await liens(10)
    expect(l[1]).toBeNull()
    expect(l[3]).toBe('https://teams.test/commun') // contenu commun : jamais verrouillé
    const r = await request(app).get(`/api/ressources/ouvrir/${ressourceEnsea.id}`).set(bearer(10))
    expect(r.status).toBe(403)
    expect(r.body.code).toBe('autoeval_requise')
    expect((await request(app).get('/api/auto-eval/en-attente').set(bearer(10))).body.verrouille).toBe(true)
  })

  it('un autre élève ENSEA ayant rempli son auto-évaluation n’est pas verrouillé', async () => {
    resetDb({ ...donnees(-50), auto_evaluations: [
      { seance_id: S.ancienne, etudiant_id: 11, competence_id: C1, niveau: 3 },
      { seance_id: S.ancienne, etudiant_id: 11, competence_id: C2, niveau: 3 }
    ] })
    expect((await liens(11))[1]).toBe('https://teams.test/ensea')
  })

  it('INP-HB n’est jamais affecté', async () => {
    resetDb(donnees(-500))
    expect((await liens(12))[2]).toBe('https://teams.test/inphb')
    expect((await request(app).get('/api/auto-eval/en-attente').set(bearer(12))).body.verrouille).toBe(false)
  })

  it('un professeur ENSEA débloque un élève ; pas un professeur d’un autre concours ni un élève', async () => {
    resetDb(donnees(-50))
    const url = `/api/seances/${S.ancienne}/debloquer`
    expect((await request(app).post(url).set(bearer(10)).send({ etudiant_id: 10 })).status).toBe(403)
    expect((await request(app).post(url).set(bearer(21)).send({ etudiant_id: 10 })).status).toBe(404)
    expect((await request(app).post(url).set(bearer(20)).send({ etudiant_id: 12 })).status).toBe(404) // pas ENSEA

    expect((await request(app).post(url).set(bearer(20)).send({ etudiant_id: 10 })).status).toBe(200)
    expect((await request(app).post(url).set(bearer(20)).send({ etudiant_id: 10 })).status).toBe(200) // idempotent
    expect(tables.autoeval_deblocages).toHaveLength(1)
    expect((await liens(10))[1]).toBe('https://teams.test/ensea')
    expect((await liens(11))[1]).toBeNull() // l'autre reste verrouillé
  })

  it('le suivi indique qui est verrouillé / débloqué', async () => {
    resetDb({ ...donnees(-50), autoeval_deblocages: [{ seance_id: S.ancienne, etudiant_id: 10 }] })
    const r = await request(app).get(`/api/seances/${S.ancienne}/suivi`).set(bearer(20))
    const parId = Object.fromEntries(r.body.eleves.map(e => [e.id, e]))
    expect(parId[10]).toMatchObject({ verrouille: false, debloque: true })
    expect(parId[11]).toMatchObject({ verrouille: true })
    expect(parId[12]).toBeUndefined()
  })
})

// ── Options des concours (administration) ───────────────────────────────────
describe('Options des concours', () => {
  it('l’admin désactive le caractère bloquant : plus de verrou', async () => {
    resetDb(base(avecSeance(S.ancienne, -50)))
    expect((await request(app).get('/api/auto-eval/en-attente').set(bearer(10))).body.verrouille).toBe(true)

    expect((await request(app).patch('/api/concours/ensea/options').set(bearer(20)).send({ autoeval_bloquante: false })).status).toBe(403)
    const r = await request(app).patch('/api/concours/ensea/options').set(bearer(30)).send({ autoeval_bloquante: false })
    expect(r.status).toBe(200)
    expect(r.body.options).toMatchObject({ generation_auto_tests: false, autoeval_bloquante: false })
    expect((await request(app).get('/api/auto-eval/en-attente').set(bearer(10))).body.verrouille).toBe(false)
  })

  it('refuse les clés inconnues et un rappel postérieur au délai', async () => {
    expect((await request(app).patch('/api/concours/ensea/options').set(bearer(30)).send({ nimporte: 1 })).status).toBe(400)
    expect((await request(app).patch('/api/concours/ensea/options').set(bearer(30)).send({ autoeval_delai_heures: 10, autoeval_rappel_heures: 20 })).status).toBe(400)
  })
})

// ── Tableaux de notes ───────────────────────────────────────────────────────
describe('Tableaux de notes', () => {
  const note = (id, etudiant, matiere, periode, valeur, jour) => ({ id, etudiant_id: etudiant, matiere, concours: 'ENSEA', periode, note: valeur, created_at: `2026-0${jour}-10T10:00:00Z` })
  const notes = [
    note(1, 10, 'Mathématiques', 'Fev 2026', 10, 2), note(2, 10, 'Mathématiques', 'Mar 2026', 14, 3),
    note(3, 11, 'Mathématiques', 'Fev 2026', 16, 2), note(4, 10, 'Français', 'Mar 2026', 12, 3),
    { id: 5, etudiant_id: 12, matiere: 'Culture Générale', concours: 'INP-HB', periode: 'Mar 2026', note: 8, created_at: '2026-03-10T10:00:00Z' }
  ]
  beforeEach(() => resetDb(base({ notes })))

  it('grille professeur : colonnes chronologiques, moyennes, filtres, élèves du concours seulement', async () => {
    const r = await request(app).get('/api/tableaux/classe?concours=ensea').set(bearer(20))
    expect(r.status).toBe(200)
    expect(r.body.colonnes.map(c => c.cle)).toEqual(['Français|Mar 2026', 'Mathématiques|Fev 2026', 'Mathématiques|Mar 2026'])
    expect(r.body.lignes.map(l => l.etudiant.id).sort()).toEqual([10, 11])
    const eleve10 = r.body.lignes.find(l => l.etudiant.id === 10)
    expect(eleve10.moyenne).toBe(12)
    expect(eleve10.notes['Mathématiques|Mar 2026'].note).toBe(14)
    expect(r.body.moyennes_colonnes['Mathématiques|Fev 2026']).toBe(13)
    expect(r.body.moyennes_matieres.Mathématiques).toBeCloseTo(13.33, 1)

    const filtre = await request(app).get('/api/tableaux/classe?concours=ensea&matiere=Français').set(bearer(20))
    expect(filtre.body.colonnes).toHaveLength(1)
    const periode = await request(app).get('/api/tableaux/classe?concours=ensea&periode=Fev 2026').set(bearer(20))
    expect(periode.body.colonnes.map(c => c.cle)).toEqual(['Mathématiques|Fev 2026'])
  })

  it('refuse : élève, professeur d’un autre concours, paramètre invalide', async () => {
    expect((await request(app).get('/api/tableaux/classe?concours=ensea').set(bearer(10))).status).toBe(403)
    expect((await request(app).get('/api/tableaux/classe?concours=ensea').set(bearer(21))).status).toBe(403)
    expect((await request(app).get('/api/tableaux/classe?concours=nimporte').set(bearer(20))).status).toBe(400)
  })

  it('vue élève : courbes par matière, moyenne, dernières corrections, pas de rang par défaut', async () => {
    const r = await request(app).get('/api/tableaux/eleve').set(bearer(10))
    expect(r.status).toBe(200)
    const maths = r.body.matieres.find(m => m.matiere === 'Mathématiques')
    expect(maths.points.map(p => p.periode)).toEqual(['Fev 2026', 'Mar 2026'])
    expect(maths.moyenne).toBe(12)
    expect(r.body.moyenne_generale).toBe(12)
    expect(r.body.dernieres.length).toBeLessThanOrEqual(5)
    expect(r.body.rangs).toEqual([])
    expect(JSON.stringify(r.body)).not.toContain('etudiant_id')
  })

  it('le rang n’apparaît que si l’admin active le classement', async () => {
    await request(app).patch('/api/concours/ensea/options').set(bearer(30)).send({ classement_visible: true })
    const r = await request(app).get('/api/tableaux/eleve').set(bearer(10))
    // moyenne élève 10 = 12 ; élève 11 = 16 → rang 2 sur 2
    expect(r.body.rangs).toEqual([{ concours_code: 'ensea', rang: 2, sur: 2 }])
  })

  it('vue admin : par concours, moyennes et taux de remplissage des auto-évaluations', async () => {
    resetDb(base({
      notes,
      ...avecSeance(S.recente, -1),
      auto_evaluations: [
        { seance_id: S.recente, etudiant_id: 10, competence_id: C1, niveau: 3 },
        { seance_id: S.recente, etudiant_id: 10, competence_id: C2, niveau: 4 },
        { seance_id: S.recente, etudiant_id: 11, competence_id: C1, niveau: 2 } // incomplet
      ]
    }))
    expect((await request(app).get('/api/tableaux/admin').set(bearer(20))).status).toBe(403)
    const r = await request(app).get('/api/tableaux/admin').set(bearer(30))
    expect(r.status).toBe(200)
    const ensea = r.body.concours.find(c => c.code === 'ensea')
    expect(ensea).toMatchObject({ nb_eleves: 2, nb_notes: 4, nb_seances_terminees: 1, taux_autoeval: 50 })
    expect(r.body.concours.find(c => c.code === 'inphb').nb_eleves).toBe(1) // seul l'élève 12 (le professeur 21 n'est pas un élève)
  })
})
