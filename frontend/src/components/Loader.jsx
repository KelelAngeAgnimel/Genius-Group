// Indicateur de chargement commun. `plein` : occupe la page (route en cours de chargement) ; sinon bloc compact.
export default function Loader({ texte = 'Chargement…', plein = false }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true"
      className={`flex flex-col items-center justify-center gap-3 text-gray-500 ${plein ? 'min-h-[50vh]' : 'py-8'}`}>
      <span aria-hidden="true" className="inline-block w-7 h-7 rounded-full border-[3px] border-gray-200 animate-spin"
        style={{ borderTopColor: '#7B4CC9' }} />
      <span className="text-sm">{texte}</span>
    </div>
  )
}
