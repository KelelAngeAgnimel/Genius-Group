// État vide commun : dit clairement qu'il n'y a rien, et propose si possible la prochaine action.
export default function EmptyState({ icone = '📭', titre, texte, action }) {
  return (
    <div className="flex flex-col items-center text-center gap-2 py-10 px-4">
      <span aria-hidden="true" className="text-3xl">{icone}</span>
      <p className="font-semibold text-gray-700">{titre}</p>
      {texte && <p className="text-sm text-gray-500 max-w-md">{texte}</p>}
      {action && (
        <button type="button" onClick={action.onClick}
          className="mt-2 text-sm font-bold px-4 py-2 rounded-xl text-white" style={{ background: '#7B4CC9' }}>
          {action.label}
        </button>
      )}
    </div>
  )
}
