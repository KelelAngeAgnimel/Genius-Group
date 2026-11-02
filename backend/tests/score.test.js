import { describe, it, expect } from 'vitest'
import {
  calculerScore, moyennePonderee, reglesScore, sousLeSeuil, ALPHA_DEFAUT, SEUIL_DEFAUT
} from '../lib/score.js'

const jour = (n) => new Date(Date.UTC(2026, 0, n)).toISOString()
const autos = (...niveaux) => niveaux.map((niveau, i) => ({ niveau, date: jour(i + 1) }))
const notes = (...valeurs) => valeurs.map((note, i) => ({ note, date: jour(i + 1) }))

describe('moyennePonderee (5 dernières mesures, poids 1 à 5)', () => {
  it('aucune valeur → null', () => expect(moyennePonderee([])).toBeNull())
  it('une valeur → elle-même', () => expect(moyennePonderee([12])).toBe(12))
  it('la plus récente pèse le plus : (10×1 + 20×2) / 3', () => {
    expect(moyennePonderee([10, 20])).toBeCloseTo(16.667, 3)
  })
  it('ne garde que les 5 dernières mesures', () => {
    // seules 1,2,3,4,5 comptent (poids 1..5) ; les 100 plus anciennes sont ignorées
    expect(moyennePonderee([100, 100, 1, 2, 3, 4, 5])).toBeCloseTo((1 + 4 + 9 + 16 + 25) / 15, 6)
  })
})

describe('calculerScore — cas limites', () => {
  it('aucune donnée → pas de score', () => {
    expect(calculerScore({})).toBeNull()
    expect(calculerScore({ autoevals: [], notes: [] })).toBeNull()
  })

  it('que des 0 → score 0', () => {
    expect(calculerScore({ autoevals: autos(0, 0, 0), notes: notes(0, 0) })).toMatchObject({ score: 0, provisoire: false })
    expect(calculerScore({ autoevals: autos(0, 0) })).toMatchObject({ score: 0, provisoire: true })
  })

  it('que des 5 en auto-évaluation et 20 en notes → 100', () => {
    expect(calculerScore({ autoevals: autos(5, 5, 5), notes: notes(20, 20) })).toMatchObject({ score: 100, provisoire: false })
    expect(calculerScore({ autoevals: autos(5, 5) })).toMatchObject({ score: 100, provisoire: true })
  })

  it('auto-évaluation seule → score provisoire (niveau / 5 × 100)', () => {
    expect(calculerScore({ autoevals: autos(3) })).toEqual({ score: 60, provisoire: true, nbAutoeval: 1, nbNotes: 0 })
  })

  it('notes seules → score non provisoire (note / 20 × 100)', () => {
    expect(calculerScore({ notes: notes(15) })).toEqual({ score: 75, provisoire: false, nbAutoeval: 0, nbNotes: 1 })
  })

  it('mélange α = 0,3 : 0,3 × 80 + 0,7 × 50 = 59', () => {
    // auto 4/5 → 80 ; note 10/20 → 50
    expect(calculerScore({ autoevals: autos(4), notes: notes(10) })).toMatchObject({ score: 59, provisoire: false })
  })

  it('α personnalisé : α = 1 ignore les notes, α = 0 ignore l’auto-évaluation', () => {
    const donnees = { autoevals: autos(4), notes: notes(10) }
    expect(calculerScore(donnees, { alpha: 1 }).score).toBe(80)
    expect(calculerScore(donnees, { alpha: 0 }).score).toBe(50)
  })

  it('α hors limites ou invalide est ramené dans [0 ; 1]', () => {
    const donnees = { autoevals: autos(4), notes: notes(10) }
    expect(calculerScore(donnees, { alpha: 7 }).score).toBe(80)
    expect(calculerScore(donnees, { alpha: -2 }).score).toBe(50)
    expect(calculerScore(donnees, { alpha: 'abc' }).score).toBe(59)
  })

  it('les données récentes pèsent davantage, quel que soit l’ordre d’arrivée', () => {
    const progression = calculerScore({ notes: [{ note: 4, date: jour(1) }, { note: 18, date: jour(9) }] })
    const regression = calculerScore({ notes: [{ note: 18, date: jour(1) }, { note: 4, date: jour(9) }] })
    expect(progression.score).toBeGreaterThan(regression.score)
    // même liste fournie dans le désordre : le résultat ne change pas
    const melange = calculerScore({ notes: [{ note: 18, date: jour(9) }, { note: 4, date: jour(1) }] })
    expect(melange.score).toBe(progression.score)
  })

  it('seules les 5 dernières mesures comptent (un ancien 0 est oublié)', () => {
    const ancien = [{ note: 0, date: jour(1) }, ...notes(20, 20, 20, 20, 20).map((n, i) => ({ ...n, date: jour(i + 5) }))]
    expect(calculerScore({ notes: ancien }).score).toBe(100)
    expect(calculerScore({ notes: ancien }).nbNotes).toBe(6) // le total compté reste complet
  })

  it('valeurs hors barème ramenées dans le barème (niveau 9 → 5, note 30 → 20, négatif → 0)', () => {
    expect(calculerScore({ autoevals: autos(9) }).score).toBe(100)
    expect(calculerScore({ notes: notes(30) }).score).toBe(100)
    expect(calculerScore({ notes: notes(-4) }).score).toBe(0)
  })

  it('le score est toujours compris entre 0 et 100, arrondi à 2 décimales', () => {
    const r = calculerScore({ autoevals: autos(1, 2, 3), notes: notes(7, 11, 13) })
    expect(r.score).toBeGreaterThanOrEqual(0)
    expect(r.score).toBeLessThanOrEqual(100)
    expect(r.score).toBe(Math.round(r.score * 100) / 100)
  })
})

describe('reglesScore et sousLeSeuil', () => {
  it('valeurs par défaut : α = 0,3, seuil = 50, mode manuel', () => {
    expect(reglesScore({})).toEqual({ alpha: ALPHA_DEFAUT, seuil: SEUIL_DEFAUT, mode: 'manuel' })
    expect(reglesScore()).toEqual({ alpha: 0.3, seuil: 50, mode: 'manuel' })
  })
  it('options du concours prises en compte, valeurs invalides ignorées', () => {
    expect(reglesScore({ score_alpha: 0.5, score_seuil: 60, renforcement_mode: 'auto' })).toEqual({ alpha: 0.5, seuil: 60, mode: 'auto' })
    expect(reglesScore({ score_alpha: 'x', score_seuil: null, renforcement_mode: 'nimporte' })).toEqual({ alpha: 0.3, seuil: 50, mode: 'manuel' })
    expect(reglesScore({ score_alpha: 5, score_seuil: 500 })).toMatchObject({ alpha: 1, seuil: 100 })
  })
  it('sous le seuil : strictement inférieur, et jamais pour un score provisoire', () => {
    expect(sousLeSeuil({ score: 49.99, provisoire: false }, 50)).toBe(true)
    expect(sousLeSeuil({ score: 50, provisoire: false }, 50)).toBe(false)
    expect(sousLeSeuil({ score: 10, provisoire: true }, 50)).toBe(false)
    expect(sousLeSeuil(null, 50)).toBe(false)
  })
})
