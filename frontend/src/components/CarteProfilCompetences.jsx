import { profilDepuisNotes, couleurNote, niveauDepuisPourcentage } from '../lib/profil'

const OR = '#C9A84C'

// Découpe un libellé en lignes de 12 caractères maximum, sans jamais le tronquer
function lignes(texte, max = 12) {
  const resultat = []
  let courante = ''
  for (const mot of String(texte).split(' ')) {
    if (courante && `${courante} ${mot}`.length > max) { resultat.push(courante); courante = mot }
    else courante = courante ? `${courante} ${mot}` : mot
  }
  if (courante) resultat.push(courante)
  return resultat
}

// Radar par matière : matieres = [{ cle, matiere, moyenne }] (moyenne sur 20)
function Radar({ matieres, size = 240 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.36
  const n = matieres.length
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2
  const pt = (i, pct) => ({ x: cx + r * (pct / 100) * Math.cos(angle(i)), y: cy + r * (pct / 100) * Math.sin(angle(i)) })
  const pourcent = (m) => Math.min(100, (m.moyenne / 20) * 100)
  const polygone = (f) => matieres.map((m, i) => `${pt(i, f(m)).x},${pt(i, f(m)).y}`).join(' ')
  const marge = 56

  return (
    <svg viewBox={`${-marge} 0 ${size + marge * 2} ${size}`} width="100%" style={{ maxWidth: size + marge * 2 }}
      role="img" aria-label="Radar des moyennes par matière">
      {[20, 40, 60, 80, 100].map(p => (
        <polygon key={p} points={polygone(() => p)} fill="none" stroke="rgba(201,168,76,0.15)" strokeWidth="1" />
      ))}
      {matieres.map((m, i) => (
        <line key={m.cle} x1={cx} y1={cy} x2={pt(i, 100).x} y2={pt(i, 100).y} stroke="rgba(201,168,76,0.15)" strokeWidth="1" />
      ))}
      <polygon points={polygone(pourcent)} fill={`${OR}33`} stroke={OR} strokeWidth="2" strokeLinejoin="round" />
      {matieres.map((m, i) => (
        <g key={m.cle}>
          <circle cx={pt(i, pourcent(m)).x} cy={pt(i, pourcent(m)).y} r="4" fill={OR} stroke="#071020" strokeWidth="1.5" />
          <text x={pt(i, pourcent(m)).x} y={pt(i, pourcent(m)).y - 7} textAnchor="middle" fontSize="9" fill={OR} fontWeight="700">
            {Math.round(pourcent(m))}
          </text>
        </g>
      ))}
      {matieres.map((m, i) => {
        const p = pt(i, 112)
        const c = Math.cos(angle(i))
        const anchor = c > 0.1 ? 'start' : c < -0.1 ? 'end' : 'middle'
        const ls = lignes(m.matiere)
        return (
          <text key={m.cle} x={p.x} y={p.y + 4 - ((ls.length - 1) * 6)} textAnchor={anchor} fontSize="10"
            fill="rgba(255,255,255,0.75)" fontWeight="600">
            {ls.map((l, k) => <tspan key={k} x={p.x} dy={k === 0 ? 0 : 12}>{l}</tspan>)}
          </text>
        )
      })}
    </svg>
  )
}

// Carte « profil de compétences » commune à l'espace professeur et à l'espace élève.
// notes : [{ matiere, note }] déjà limitées au bon élève (et au bon concours) par l'appelant.
export default function CarteProfilCompetences({ nom, matricule, notes, chargement = false }) {
  const { matieres, nbNotes, moyenneGenerale, niveau } = profilDepuisNotes(notes)

  return (
    <div className="rounded-2xl p-5" style={{ background: '#071020', border: '1px solid rgba(201,168,76,0.3)' }}>
      <div className="flex items-center gap-3 mb-4">
        <div aria-hidden="true" className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: 'rgba(201,168,76,0.2)', border: `1px solid ${OR}`, color: OR }}>
          {String(nom ?? '?').trim()[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white truncate">{nom}</p>
          {matricule && <p className="text-xs text-gray-400">{matricule}</p>}
        </div>
        {nbNotes > 0 && (
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: OR }}>{moyenneGenerale.toFixed(1)}/20</p>
            <span style={{ background: niveau.fond, color: niveau.couleur, border: `1px solid ${niveau.couleur}`, fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
              {niveau.libelle}
            </span>
          </div>
        )}
      </div>

      {chargement ? (
        <div role="status" className="flex justify-center py-6">
          <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: OR, borderTopColor: 'transparent' }} />
        </div>
      ) : matieres.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4">Pas encore de notes</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="flex justify-center">
            {matieres.length >= 3
              ? <Radar matieres={matieres} />
              : <p className="text-xs text-gray-400 text-center py-4">Le radar apparaît à partir de 3 matières notées.</p>}
          </div>
          <div className="flex flex-col gap-3 justify-center">
            {matieres.map(m => {
              const couleur = couleurNote(m.moyenne)
              const pct = Math.min(100, (m.moyenne / 20) * 100)
              const niv = niveauDepuisPourcentage(pct)
              return (
                <div key={m.cle}>
                  <div className="flex justify-between items-baseline mb-1 gap-2">
                    <span className="text-xs text-gray-300">{m.matiere}</span>
                    <span className="text-xs font-bold" style={{ color: couleur }} title={niv.libelle}>
                      {Number(m.moyenne.toFixed(2))}/20
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: couleur }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
