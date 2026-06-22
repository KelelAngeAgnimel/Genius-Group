// frontend/src/pages/meetings/Meetings.jsx
// Module "Cours à distance" — palette Genius Group

import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useMeetings } from './useMeetings'
import MeetingCard from './MeetingCard'
import MeetingFormModal from './MeetingFormModal'

function loadJitsiScript() {
  return new Promise((resolve) => {
    if (window.JitsiMeetExternalAPI) { resolve(); return }
    const script = document.createElement('script')
    script.src = 'https://meet.jit.si/external_api.js'
    script.onload = resolve
    document.head.appendChild(script)
  })
}

export default function Meetings() {
  const { user, token } = useAuth()
  const role = user?.role ?? 'etudiant'
  const isAdmin = role === 'admin'

  const { meetings, loading, error, createMeeting, toggleLive, deleteMeeting } = useMeetings(token)

  const [selected, setSelected] = useState(null)
  const [inCall, setInCall] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const jitsiRef = React.useRef(null)
  const jitsiApiRef = React.useRef(null)

  const handleSelect = (meeting) => {
    if (selected?.id === meeting.id) return
    leaveCall()
    setSelected(meeting)
  }

  const handleJoin = async () => {
    if (!selected) return
    await loadJitsiScript()
    setInCall(true)
    setTimeout(() => {
      if (jitsiApiRef.current) jitsiApiRef.current.dispose()
      jitsiApiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
        roomName: selected.salle,
        parentNode: jitsiRef.current,
        width: '100%',
        height: '100%',
        userInfo: { displayName: user?.nom ?? user?.email ?? 'Utilisateur' },
      })
    }, 100)
  }

  const leaveCall = () => {
    if (jitsiApiRef.current) { jitsiApiRef.current.dispose(); jitsiApiRef.current = null }
    setInCall(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce cours ?')) return
    if (selected?.id === id) { leaveCall(); setSelected(null) }
    await deleteMeeting(id)
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] p-6">
      <p className="text-sm text-gray-500 mb-4">Cours à distance — Genius Group</p>

      <div className="flex h-[calc(100vh-10rem)] rounded-xl overflow-hidden shadow-md">

        <aside className="w-72 flex flex-col flex-shrink-0 bg-[#0f1f3d]">
          <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
            <span className="text-2xl">📹</span>
            <div>
              <p className="font-bold text-white text-sm leading-tight">Cours à distance</p>
              <p className="text-[11px] text-white/40 uppercase tracking-wider">Réunions</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2">
            {loading && <p className="text-sm text-white/40 text-center mt-6">Chargement…</p>}
            {error && <p className="text-sm text-rose-400 text-center mt-6">{error}</p>}
            {!loading && meetings.length === 0 && (
              <p className="text-sm text-white/40 text-center mt-6">Aucun cours pour l'instant.</p>
            )}
            {meetings.map((m) => (
              <MeetingCard
                key={m.id}
                meeting={m}
                isActive={selected?.id === m.id}
                onSelect={handleSelect}
                canManage={isAdmin}
                onToggleLive={toggleLive}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="m-3 py-2.5 bg-amber-500 hover:bg-amber-400 text-[#0f1f3d] text-sm font-bold rounded-lg transition-colors"
            >
              ＋ Nouveau cours
            </button>
          )}
        </aside>

        <main className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="flex items-center gap-3 px-6 h-14 border-b border-gray-100 flex-shrink-0">
            <h2 className="font-semibold text-[#0f1f3d] text-base truncate">
              {selected ? selected.titre : 'Aucun cours sélectionné'}
            </h2>
            {selected && (
              <span className="text-sm text-gray-400">{selected.prof} · {selected.heure}</span>
            )}
            {inCall && (
              <button
                onClick={leaveCall}
                className="ml-auto px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Quitter
              </button>
            )}
          </div>

          <div className="flex-1 relative bg-[#0f172a]">
            {!inCall && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-white/40">
                <span className="text-6xl">🎓</span>
                {!selected && <p className="text-sm">Sélectionnez un cours dans la liste.</p>}
                {selected && (
                  <>
                    <p className="text-sm">
                      Prêt à rejoindre <strong className="text-amber-400">{selected.titre}</strong>
                    </p>
                    <button
                      onClick={handleJoin}
                      className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-xl transition-colors text-sm"
                    >
                      Rejoindre la réunion
                    </button>
                  </>
                )}
              </div>
            )}
            <div ref={jitsiRef} className="w-full h-full" style={{ display: inCall ? 'block' : 'none' }} />
          </div>
        </main>
      </div>

      {showModal && (
        <MeetingFormModal onClose={() => setShowModal(false)} onCreate={createMeeting} />
      )}
    </div>
  )
}
