import supabase from '../supabase.js'
import { concoursDepuisAncienRole, roleDeBase, CODES_CONCOURS } from './concours.js'

// Tables absentes (migration SQL pas encore passée) : on retombe sur les anciens rôles.
const TABLE_ABSENTE = new Set(['42P01', 'PGRST205', 'PGRST200'])

// Map id → [codes de concours] pour une liste d'utilisateurs (null si la table n'existe pas encore)
async function lireInscriptions(ids) {
  if (ids.length === 0) return new Map()
  const { data, error } = await supabase
    .from('inscriptions')
    .select('user_id, concours_code')
    .in('user_id', ids)
  if (error) {
    if (TABLE_ABSENTE.has(error.code)) return null
    throw error
  }
  const parUtilisateur = new Map()
  for (const { user_id, concours_code } of data ?? []) {
    const cle = String(user_id)
    if (!parUtilisateur.has(cle)) parUtilisateur.set(cle, [])
    parUtilisateur.get(cle).push(concours_code)
  }
  return parUtilisateur
}

// Ajoute `concours` (liste de codes) à chaque utilisateur et normalise le rôle (etudiant_* → etudiant).
// Un utilisateur sans inscription conserve les concours déduits de son ancien rôle (rétro-compatible).
export async function avecConcours(utilisateurs) {
  const liste = utilisateurs ?? []
  const inscriptions = await lireInscriptions(liste.map(u => u.id))
  return liste.map(u => {
    const inscrits = inscriptions?.get(String(u.id))
    const concours = inscrits?.length ? inscrits : concoursDepuisAncienRole(u.role)
    return { ...u, role: roleDeBase(u.role), concours }
  })
}

export async function avecConcoursUn(utilisateur) {
  return utilisateur ? (await avecConcours([utilisateur]))[0] : null
}

// Remplace les inscriptions d'un utilisateur par la liste donnée
export async function definirInscriptions(userId, codes) {
  const uniques = [...new Set(codes)].filter(c => CODES_CONCOURS.includes(c))
  const { error: errDel } = await supabase.from('inscriptions').delete().eq('user_id', userId)
  if (errDel) throw errDel
  if (uniques.length === 0) return
  const { error } = await supabase
    .from('inscriptions')
    .insert(uniques.map(concours_code => ({ user_id: userId, concours_code })))
  if (error) throw error
}

// Charge un utilisateur (id, role) avec sa liste de concours ; null s'il n'existe pas
export async function chargerAvecConcours(id) {
  const { data, error } = await supabase.from('users').select('id, role').eq('id', id).maybeSingle()
  if (error) throw error
  return avecConcoursUn(data)
}
