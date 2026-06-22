// frontend/src/pages/meetings/MeetingCard.jsx
// Carte d'un meeting — utilisée dans Admin, Professeur et Étudiant

import React from 'react'

export default function MeetingCard({ meeting, onSelect, isActive, canManage, onToggleLive, onDelete }) {
  const { titre, prof, heure, live } = meeting

  return (
    <div
      onClick={() => onSelect(meeting)}
      className={`
        flex flex-col gap-1 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150
        ${isActive
          ? 'bg-white/15 border border-amber-400/50'
          : 'hover:bg-white/10 border border-transparent'}
      `}
    >
      <div className="flex items-center gap-2">
        {live && (
          <span className="inline-block w-2 h-2 rounded-full bg-rose-400 animate-pulse flex-shrink-0" />
        )}
        <span className={`font-semibold text-sm truncate ${isActive ? 'text-amber-400' : 'text-white'}`}>
          {titre}
        </span>
      </div>

      <span className="text-xs text-white/50">{prof} · {heure}</span>

      {canManage && (
        <div className="flex gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onToggleLive(meeting.id, live)}
            className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors
              ${live
                ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              }`}
          >
            {live ? '⏹ Arrêter' : '▶ Démarrer'}
          </button>
          <button
            onClick={() => onDelete(meeting.id)}
            className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50 hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
          >
            Supprimer
          </button>
        </div>
      )}
    </div>
  )
}
