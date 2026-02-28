import { useState } from 'react'

export default function TuteurIA() {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([
    { role: 'ia', texte: 'Bonjour ! Je suis ton tuteur IA. Pose-moi une question sur n\'importe quelle matière.' }
  ])

  const envoyer = () => {
    if (!question.trim()) return
    setMessages([
      ...messages,
      { role: 'user', texte: question },
      { role: 'ia', texte: '🤖 Je traite ta question... (fonctionnalité complète disponible à l\'étape 9)' }
    ])
    setQuestion('')
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-red-800 mb-2">🤖 Tuteur IA</h2>
      <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full mb-4 inline-block">IA</span>

      <div className="border border-gray-200 rounded-xl p-4 h-64 overflow-y-auto flex flex-col gap-3 mb-4 bg-gray-50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-4 py-2 rounded-xl text-sm max-w-xs ${
              m.role === 'user'
                ? 'bg-red-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700'
            }`}>
              {m.texte}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && envoyer()}
          placeholder="Pose ta question..."
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
        />
        <button
          onClick={envoyer}
          className="bg-red-700 text-white px-5 py-2 rounded-xl hover:bg-red-800 font-semibold"
        >
          Envoyer
        </button>
      </div>
    </div>
  )
}