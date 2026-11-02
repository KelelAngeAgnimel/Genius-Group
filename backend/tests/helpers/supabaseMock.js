import { vi } from 'vitest'

// Faux client Supabase en mémoire : tables = { users: [...], ressources: [...] }
export const tables = { users: [], ressources: [] }
export const operations = [] // journal : { table, op, filtres }

export function resetDb(donnees = {}) {
  tables.users = donnees.users ?? []
  tables.ressources = donnees.ressources ?? []
  operations.length = 0
}

function from(table) {
  const filtres = {}
  let op = 'select'
  let valeurs = null
  const lignes = () => (tables[table] ?? []).filter(l => Object.entries(filtres).every(([k, v]) => String(l[k]) === String(v)))
  const executer = () => {
    operations.push({ table, op, filtres: { ...filtres } })
    if (op === 'update') lignes().forEach(l => Object.assign(l, valeurs))
    if (op === 'delete') {
      const cibles = lignes()
      tables[table] = tables[table].filter(l => !cibles.includes(l))
    }
  }
  const q = {
    select: () => q,
    update: (v) => { op = 'update'; valeurs = v; return q },
    delete: () => { op = 'delete'; return q },
    eq: (k, v) => { filtres[k] = v; return q },
    maybeSingle: async () => { executer(); return { data: lignes()[0] ?? null, error: null } },
    single: async () => { executer(); return { data: lignes()[0] ?? null, error: null } },
    then: (ok, ko) => { executer(); return Promise.resolve({ data: null, error: null }).then(ok, ko) }
  }
  return q
}

export const supabaseMock = {
  from: vi.fn(from),
  storage: { from: () => ({ remove: vi.fn(async () => ({ error: null })) }) }
}
