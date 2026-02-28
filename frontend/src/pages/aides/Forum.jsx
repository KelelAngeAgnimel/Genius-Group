import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function Forum() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([
    { auteur: 'Marie L.', matricule: '26GEN0001', texte: 'Des conseils pour les intégrales en MP ?', date: '27 Fév 2026', likes: 5 },
    { auteur: 'Thomas R.', matricule: '26GEN0002', texte: 'Comment gérer le stress avant les épreuves ?', date: '26 Fév 2026', likes: 8 },
  ])
  const [nouveau, setNouveau] = useState('')

  const publier = () => {
    if (!nouveau.trim()) return
    setPosts([{
      auteur: `${user?.prenom} ${user?.nom}`,
      matricule: user?.matricule,
      texte: nouveau,
      date: 'Aujourd\'hui',
      likes: 0
    }, ...posts])
    setNouveau('')
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-purple-800 mb-2">👥 Forum étudiant</h2>
      <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full mb-4 inline-block">NEW</span>

      <div className="flex gap-2 mb-6 mt-2">
        <input
          type="text"
          value={nouveau}
          onChange={(e) => setNouveau(e.target.value)}
          placeholder="Pose une question au forum..."
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <button
          onClick={publier}
          className="bg-purple-700 text-white px-5 py-2 rounded-xl hover:bg-purple-800 font-semibold"
        >
          Publier
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {posts.map((p, i) => (
          <div key={i} className="border border-purple-100 rounded-xl p-4 hover:shadow transition">
            <div className="flex justify-between mb-1">
              <span className="font-bold text-purple-800">{p.auteur}</span>
              <span className="text-xs text-gray-400">{p.date}</span>
            </div>
            <p className="text-xs text-gray-400 mb-2">{p.matricule}</p>
            <p className="text-gray-700 text-sm">{p.texte}</p>
            <p className="text-xs text-purple-500 mt-2">👍 {p.likes}</p>
          </div>
        ))}
      </div>
    </div>
  )
}