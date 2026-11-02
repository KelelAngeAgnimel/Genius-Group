import { Fragment } from 'react'

// Petit lecteur Markdown pour les guides (docs/guide-*.md). Il ne gère que ce que les guides utilisent :
// titres (#, ##), listes numérotées et à puces, citations (>), gras (**…**) et code (`…`).
// Les lignes « [CAPTURE: …] » sont des repères pour les captures d'écran à venir : elles ne s'affichent pas.
// Aucun HTML brut n'est interprété (tout passe par React), le contenu ne peut donc pas injecter de code.

function Inline({ texte }) {
  const morceaux = texte.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean)
  return morceaux.map((m, i) => {
    if (m.startsWith('**')) return <strong key={i} className="font-semibold text-[#071020]">{m.slice(2, -2)}</strong>
    if (m.startsWith('`')) return <code key={i} className="px-1 py-0.5 rounded bg-gray-100 text-[0.9em]">{m.slice(1, -1)}</code>
    return <Fragment key={i}>{m}</Fragment>
  })
}

// Découpe le texte en blocs : { type: 'h1' | 'h2' | 'ol' | 'ul' | 'quote' | 'p', ... }
function lireBlocs(markdown) {
  const blocs = []
  let courant = null
  const fermer = () => { if (courant) { blocs.push(courant); courant = null } }

  for (const brute of String(markdown ?? '').split(/\r?\n/)) {
    const ligne = brute.trimEnd()
    if (ligne.trim() === '' || /^\[CAPTURE:.*\]$/.test(ligne.trim())) { fermer(); continue }

    let m
    if ((m = /^(#{1,2})\s+(.*)$/.exec(ligne))) { fermer(); blocs.push({ type: m[1].length === 1 ? 'h1' : 'h2', texte: m[2] }); continue }
    if ((m = /^\d+\.\s+(.*)$/.exec(ligne))) {
      if (courant?.type !== 'ol') { fermer(); courant = { type: 'ol', items: [] } }
      courant.items.push(m[1]); continue
    }
    if ((m = /^[-*]\s+(.*)$/.exec(ligne))) {
      if (courant?.type !== 'ul') { fermer(); courant = { type: 'ul', items: [] } }
      courant.items.push(m[1]); continue
    }
    if ((m = /^>\s?(.*)$/.exec(ligne))) {
      if (courant?.type !== 'quote') { fermer(); courant = { type: 'quote', texte: '' } }
      courant.texte += (courant.texte ? ' ' : '') + m[1]; continue
    }
    // Paragraphe : les lignes consécutives se rejoignent
    if (courant?.type !== 'p') { fermer(); courant = { type: 'p', texte: '' } }
    courant.texte += (courant.texte ? ' ' : '') + ligne.trim()
  }
  fermer()
  return blocs
}

export default function Markdown({ texte }) {
  return (
    <div className="text-sm leading-relaxed text-gray-700 flex flex-col gap-3">
      {lireBlocs(texte).map((b, i) => {
        switch (b.type) {
          case 'h1':
            return <h1 key={i} className="text-2xl font-bold" style={{ color: '#071020' }}><Inline texte={b.texte} /></h1>
          case 'h2':
            return <h2 key={i} className="text-lg font-bold mt-4 pt-3 border-t border-gray-200" style={{ color: '#071020' }}><Inline texte={b.texte} /></h2>
          case 'ol':
            return <ol key={i} className="list-decimal pl-6 flex flex-col gap-1.5">{b.items.map((it, j) => <li key={j}><Inline texte={it} /></li>)}</ol>
          case 'ul':
            return <ul key={i} className="list-disc pl-6 flex flex-col gap-1.5">{b.items.map((it, j) => <li key={j}><Inline texte={it} /></li>)}</ul>
          case 'quote':
            return <blockquote key={i} className="rounded-xl px-4 py-3 text-gray-700" style={{ background: 'rgba(201,168,76,0.12)', borderLeft: '4px solid #C9A84C' }}><Inline texte={b.texte} /></blockquote>
          default:
            return <p key={i}><Inline texte={b.texte} /></p>
        }
      })}
    </div>
  )
}
