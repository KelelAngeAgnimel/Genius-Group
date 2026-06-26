// frontend/src/pages/meetings/MeetingFormModal.jsx
// Modale de création d'un nouveau cours/meeting

import React, { useState } from 'react'

export default function MeetingFormModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ titre: '', prof: '', heure: '' })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async () => {
    if (!form.titre.trim()) { setErr('Le titre est obligatoire.'); return }
    setLoading(true)
    setErr('')
    try {
      const salle = 'Cours_' + form.titre.replace(/\s+/g, '_') + '_' + Date.now()
      await onCreate({ ...form, salle, live: false })
      onClose()
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#0f1f3d] rounded-xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4 border border-white/10">
        <h3 className="text-lg font-bold text-white">Nouveau cours</h3>

        {err && <p className="text-sm text-rose-400 bg-rose-400/10 rounded px-3 py-2">{err}</p>}

        <input
          name="titre"
          value={form.titre}
          onChange={handle}
          placeholder="Titre  (ex : Maths — Algèbre)"
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400"
        />
        <input
          name="prof"
          value={form.prof}
          onChange={handle}
          placeholder="Enseignant  (ex : M. Diop)"
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400"
        />
        <input
          name="heure"
          value={form.heure}
          onChange={handle}
          placeholder="Heure  (ex : 10:00)"
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400"
        />

        <div className="flex justify-end gap-2 mt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 text-white/70 text-sm font-medium hover:bg-white/20 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#0f1f3d] text-sm font-bold transition-colors disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  )
}