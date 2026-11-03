// Barre d'outils des listes : recherche instantanée, filtre, tri et bascule Cartes / Liste.
const champ = 'rounded-xl text-sm px-3 py-2 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]'
const bordure = { border: '1px solid #e5e0d0' }

export default function BarreOutils({ recherche, onRecherche, filtre, onFiltre, filtres, tri, onTri, tris, vue, onVue }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-5" role="toolbar" aria-label="Outils de la liste">
      {filtres && (
        <select aria-label="Filtrer par type" value={filtre} onChange={e => onFiltre(e.target.value)} className={champ} style={bordure}>
          {filtres.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      )}
      <input type="search" aria-label="Rechercher" placeholder="Rechercher…" value={recherche}
        onChange={e => onRecherche(e.target.value)} className={`${champ} flex-1 min-w-[10rem]`} style={bordure} />
      {tris && (
        <select aria-label="Trier" value={tri} onChange={e => onTri(e.target.value)} className={champ} style={bordure}>
          {tris.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      )}
      <div className="flex rounded-xl overflow-hidden" role="group" aria-label="Affichage" style={bordure}>
        {[{ v: 'cartes', l: 'Cartes' }, { v: 'liste', l: 'Liste' }].map(o => (
          <button key={o.v} type="button" aria-pressed={vue === o.v} onClick={() => onVue(o.v)}
            className="px-3 py-2 text-sm font-semibold"
            style={{ background: vue === o.v ? '#071020' : '#fff', color: vue === o.v ? '#C9A84C' : '#6b7280' }}>
            {o.l}
          </button>
        ))}
      </div>
    </div>
  )
}
