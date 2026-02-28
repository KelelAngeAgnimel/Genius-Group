import { useState } from 'react'

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { role: 'bot', texte: 'Bonjour ! Je suis le chatbot d\'aide. Comment puis-je t\'aider ?' }
  ])
  const [input, setInput] = useState('')

  const envoyer = () => {
    if (!input.trim()) return
    setMessages([
      ...messages,
      { role: 'user', texte: input },
      { role: 'bot', texte: '🤖 Je traite ta demande... (fonctionnalité complète disponible à l\'étape 9)' }
    ])
    setInput('')
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-purple-800 mb-2">🤖 Chatbot d'aide</h2>
      <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full mb-4 inline-block">IA</span>

      <div className="border border-gray-200 rounded-xl p-4 h-64 overflow-y-auto flex flex-col gap-3 mb-4 bg-gray-50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-4 py-2 rounded-xl text-sm max-w-xs ${
              m.role === 'user'
                ? 'bg-purple-600 text-white'
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
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && envoyer()}
          placeholder="Écris ta question..."
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <button
          onClick={envoyer}
          className="bg-purple-700 text-white px-5 py-2 rounded-xl hover:bg-purple-800 font-semibold"
        >
          Envoyer
        </button>
      </div>
    </div>
  )
}