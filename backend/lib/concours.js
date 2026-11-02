// Module unique pour tout ce qui touche aux concours.
// Modèle : users.role ∈ etudiant / professeur / admin + table inscriptions (user_id, concours_code).
// Compatibilité : tant que la migration SQL n'est pas passée, les anciens rôles combinés
// (etudiant_inphb_cme, etudiant_all…) sont traduits en liste de concours à la volée.

import { z } from 'zod'

export const CODES_CONCOURS = ['inphb', 'esatic', 'cme', 'ensea']

const ROLES_ANCIENS = {
  etudiant_inphb: ['inphb'],
  etudiant_esatic: ['esatic'],
  etudiant_cme: ['cme'],
  etudiant_inphb_cme: ['inphb', 'cme'],
  etudiant_esatic_cme: ['esatic', 'cme'],
  etudiant_both: ['inphb', 'esatic'],
  etudiant_all: ['inphb', 'esatic', 'cme']
}

// « INP-HB », "inp-hb", " Inphb " → "inphb"
export const normaliser = (v) => String(v ?? '').toLowerCase().replace(/[\s_-]/g, '')

// Rôle ancien ou nouveau → rôle de base (etudiant / professeur / admin)
export function roleDeBase(role) {
  if (typeof role === 'string' && role.startsWith('etudiant')) return 'etudiant'
  return role
}

export const estEtudiant = (userOuRole) =>
  roleDeBase(typeof userOuRole === 'string' ? userOuRole : userOuRole?.role) === 'etudiant'

// Concours déduits d'un ancien rôle (vide pour un rôle déjà migré)
export const concoursDepuisAncienRole = (role) => [...(ROLES_ANCIENS[role] ?? [])]

// Liste des concours de l'utilisateur : inscriptions si elles existent, sinon ancien rôle.
export function concoursDeLUtilisateur(user) {
  if (!user) return []
  return Array.isArray(user.concours) ? user.concours : []
}

// Valeur stockée sur un contenu (ressource, cours, quiz, note…) → liste de codes.
//  - null  : contenu pour tout le monde (« tous », « all », « both », vide)
//  - []    : valeur inconnue (visible seulement du personnel non restreint)
//  - [...] : concours ciblés. Accepte les formats combinés (« inp-hb + esatic »).
export function codesDepuisContenu(valeur) {
  const v = normaliser(valeur)
  if (v === '' || v === 'tous' || v === 'all' || v === 'both' || v === 'aucun') return null
  return CODES_CONCOURS.filter(code => v.includes(code) || (code === 'inphb' && v.includes('inp')))
}

// Un professeur sans aucune inscription n'est pas restreint (transition).
export const estPersonnelRestreint = (user) =>
  user?.role === 'professeur' && concoursDeLUtilisateur(user).length > 0

// L'utilisateur peut-il voir ce contenu ?
export function peutAcceder(user, valeurContenu) {
  if (!user) return false
  if (user.role === 'admin') return true
  const cibles = codesDepuisContenu(valeurContenu)
  if (cibles === null) return true
  if (user.role === 'professeur' && !estPersonnelRestreint(user)) return true
  const miens = concoursDeLUtilisateur(user)
  return cibles.some(c => miens.includes(c))
}

// L'utilisateur peut-il publier un contenu pour ce concours ? (professeurs rattachés : leurs concours seulement)
export function peutPublierPour(user, valeurContenu) {
  if (!user) return false
  if (user.role === 'admin') return true
  if (user.role !== 'professeur') return false
  if (!estPersonnelRestreint(user)) return true
  const cibles = codesDepuisContenu(valeurContenu)
  if (cibles === null || cibles.length === 0) return false
  const miens = concoursDeLUtilisateur(user)
  return cibles.every(c => miens.includes(c))
}

// Le personnel peut-il agir sur cet élève ? (prof ENSEA → élèves ENSEA uniquement)
export function peutGererEleve(user, eleve) {
  if (!user) return false
  if (user.role === 'admin') return true
  if (user.role !== 'professeur') return false
  if (!estPersonnelRestreint(user)) return true
  const miens = concoursDeLUtilisateur(user)
  return concoursDeLUtilisateur(eleve).some(c => miens.includes(c))
}

// Valeur de concours acceptée à l'écriture d'un contenu : un code, ou « both » / « all » (tous)
export const concoursContenuSchema = z.string().trim().toLowerCase()
  .refine(v => CODES_CONCOURS.includes(v) || ['both', 'all', 'tous'].includes(v), 'Concours inconnu')

// Libellé utilisé par la table notes (« INP-HB », « ESATIC »…) pour un code
export const LIBELLES = { inphb: 'INP-HB', esatic: 'ESATIC', cme: 'CME', ensea: 'ENSEA' }
