// État vide commun : dit clairement qu'il n'y a rien, et propose si possible la prochaine action.
// L'ancienne prop `icone` (émoji) est ignorée : une seule icône SVG fine pour tous les états vides.
export default function EmptyState({ titre, texte, action }) {
  return (
    <div className="flex flex-col items-center text-center gap-2 py-10 px-4">
      <svg aria-hidden="true" className="w-8 h-8 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.5 13.5 6 5.5h12l2.5 8" /><path d="M3.5 13.5V18a1.5 1.5 0 0 0 1.5 1.5h14a1.5 1.5 0 0 0 1.5-1.5v-4.5h-5l-1 2h-5l-1-2h-5Z" />
      </svg>
      <p className="font-semibold text-gray-700">{titre}</p>
      {texte && <p className="text-sm text-gray-500 max-w-md">{texte}</p>}
      {action && (
        <button type="button" onClick={action.onClick}
          className="mt-2 text-sm font-bold px-4 py-2 rounded-xl text-white" style={{ background: '#071020' }}>
          {action.label}
        </button>
      )}
    </div>
  )
}
