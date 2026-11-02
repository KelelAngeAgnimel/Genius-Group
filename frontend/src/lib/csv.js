// Lecture et écriture de CSV (séparateur `;` ou `,`, guillemets, BOM d'Excel).

// Détecte le séparateur d'après la première ligne (Excel français : « ; »)
function separateur(texte) {
  const premiere = texte.split(/\r?\n/, 1)[0] ?? ''
  return (premiere.match(/;/g) ?? []).length >= (premiere.match(/,/g) ?? []).length ? ';' : ','
}

// Retourne un tableau d'objets d'après l'en-tête (clés en minuscules sans accents : matiere, code, libelle, ordre, url)
export function lireCsv(texte) {
  const brut = String(texte ?? '').replace(/^\uFEFF/, '')
  const sep = separateur(brut)
  const lignes = []
  let ligne = []
  let champ = ''
  let guillemets = false

  for (let i = 0; i < brut.length; i++) {
    const c = brut[i]
    if (guillemets) {
      if (c === '"' && brut[i + 1] === '"') { champ += '"'; i++ }
      else if (c === '"') guillemets = false
      else champ += c
    } else if (c === '"') guillemets = true
    else if (c === sep) { ligne.push(champ); champ = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && brut[i + 1] === '\n') i++
      ligne.push(champ); champ = ''
      if (ligne.some(v => v.trim() !== '')) lignes.push(ligne)
      ligne = []
    } else champ += c
  }
  ligne.push(champ)
  if (ligne.some(v => v.trim() !== '')) lignes.push(ligne)
  if (lignes.length < 2) return []

  const entetes = lignes[0].map(h => h.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''))
  return lignes.slice(1).map(valeurs =>
    Object.fromEntries(entetes.map((h, i) => [h, (valeurs[i] ?? '').trim()]))
  )
}

// Une cellule qui commence par = + - @ serait interprétée comme une formule par Excel : on la neutralise
const neutraliser = (v) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v)

export function versCsv(lignes) {
  const cellule = (v) => {
    const texte = neutraliser(v == null ? '' : String(v))
    return /[;"\n\r]/.test(texte) ? `"${texte.replace(/"/g, '""')}"` : texte
  }
  // BOM + « ; » : s'ouvre correctement dans Excel en français
  return '\uFEFF' + lignes.map(l => l.map(cellule).join(';')).join('\r\n')
}

export function telechargerCsv(nomFichier, lignes) {
  const blob = new Blob([versCsv(lignes)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomFichier
  a.click()
  URL.revokeObjectURL(url)
}
