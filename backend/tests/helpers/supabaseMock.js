import { randomUUID } from 'node:crypto'
import { vi } from 'vitest'

// Faux client Supabase en mémoire : tables = { users: [...], ressources: [...] }
export const tables = { users: [], ressources: [], inscriptions: [], evaluations: [], copies: [], notes: [] }
export const operations = [] // journal : { table, op, filtres }

// Faux stockage : fichiers déposés, suppressions et URL signées émises
export const stockage = { fichiers: new Map(), suppressions: [], urls: [] }

export function resetDb(donnees = {}) {
  for (const nom of Object.keys(tables)) tables[nom] = donnees[nom] ?? []
  operations.length = 0
  stockage.fichiers.clear()
  stockage.suppressions.length = 0
  stockage.urls.length = 0
}

function from(table) {
  const filtres = {}
  let op = 'select'
  let valeurs = null
  let inseres = []
  const dans = {}
  const lignes = () => (tables[table] ?? [])
    .filter(l => Object.entries(filtres).every(([k, v]) => String(l[k]) === String(v)))
    .filter(l => Object.entries(dans).every(([k, vs]) => vs.map(String).includes(String(l[k]))))
  // Copies, comme le vrai client : modifier une ligne ne change pas ce qui a déjà été lu
  const resultat = () => structuredClone(op === 'insert' ? inseres : lignes())
  const executer = () => {
    operations.push({ table, op, filtres: { ...filtres } })
    if (op === 'update') lignes().forEach(l => Object.assign(l, valeurs))
    if (op === 'insert') tables[table].push(...inseres)
    if (op === 'delete') {
      const cibles = lignes()
      tables[table] = tables[table].filter(l => !cibles.includes(l))
    }
  }
  const q = {
    select: () => q,
    order: () => q,
    insert: (rows) => { op = 'insert'; inseres = rows.map(r => ({ id: randomUUID(), ...r })); return q },
    update: (v) => { op = 'update'; valeurs = v; return q },
    delete: () => { op = 'delete'; return q },
    eq: (k, v) => { filtres[k] = v; return q },
    in: (k, vs) => { dans[k] = vs; return q },
    maybeSingle: async () => { executer(); return { data: resultat()[0] ?? null, error: null } },
    single: async () => { executer(); return { data: resultat()[0] ?? null, error: null } },
    then: (ok, ko) => { executer(); return Promise.resolve({ data: op === 'select' ? resultat() : null, error: null }).then(ok, ko) }
  }
  return q
}

export const supabaseMock = {
  from: vi.fn(from),
  storage: {
    from: (bucket) => ({
      upload: vi.fn(async (chemin, contenu) => { stockage.fichiers.set(`${bucket}/${chemin}`, contenu); return { error: null } }),
      remove: vi.fn(async (chemins) => { stockage.suppressions.push(...chemins.map(c => `${bucket}/${c}`)); return { error: null } }),
      createSignedUrl: vi.fn(async (chemin, secondes) => {
        stockage.urls.push({ bucket, chemin, secondes })
        return { data: { signedUrl: `https://signed.test/${bucket}/${chemin}?ttl=${secondes}` }, error: null }
      })
    })
  }
}
