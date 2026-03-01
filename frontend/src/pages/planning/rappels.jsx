import { useState } from 'react'

export default function Rappels() {
  const [rappels, setRappels] = useState([
    { id: 1, texte: 'Réviser les intégrales', date: '01 Mars 2026', fait: false },
    { id: 2, texte: 'Finir les exercices de chimie', date: '03 Mars 2026', fait: false },
    { id: 3, texte: 'Relire les fiches d\'anglais', date: '05 Mars 2026', fait: true },
  ])

  const toggle = (id) => {
    setRappels(rappels.map(r => r.id === id ? { ...r, fait: !r.fait } : r))
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-green-800 mb-4">🔔 Rappels & alertes</h2>
      <div className="flex flex-col gap-3">
        {rappels.map((r) => (
          <div
            key={r.id}
            className={`flex items-center justify-between border rounded-xl p-4 transition ${
              r.fait ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-green-200 hover:shadow'
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={r.fait}
                onChange={() => toggle(r.id)}
                className="w-5 h-5 accent-green-600"
              />
              <span className={`font-medium ${r.fait ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                {r.texte}
              </span>
            </div>
            <span className="text-xs text-gray-400">{r.date}</span>
          </div>
        ))}
      </div>
    </div>
  )
}