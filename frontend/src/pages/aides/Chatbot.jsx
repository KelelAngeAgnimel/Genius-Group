import { useState, useRef, useEffect } from 'react'

const SESSION_ID = crypto.randomUUID()
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { role: 'bot', texte: "Bonjour ! Je suis le chatbot d'aide. Comment puis-je t'aider ?" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const envoyer = async () => {
    if (!input.trim() || loading) return
    const userMessage = input
    setMessages(prev => [...prev, { role: 'user', texte: userMessage }])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, sessionId: SESSION_ID })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'bot', texte: data.reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'bot', texte: '❌ Erreur de connexion. Réessaie.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: "'Lato', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Lato:wght@300;400;700&display=swap" rel="stylesheet" />

      <div style={{
        background: '#0a1628',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid #1e3a5f',
        maxWidth: '720px',
        margin: '0 auto'
      }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0d1f3c 0%, #1a3a6b 100%)',
          padding: '20px 24px',
          borderBottom: '2px solid #c9a227',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: '#c9a227', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '20px', flexShrink: 0,
            boxShadow: '0 0 0 3px rgba(201,162,39,0.2)'
          }}>✦</div>
          <div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: '17px', color: '#c9a227', letterSpacing: '0.5px' }}>
              Chatbot d'aide
            </div>
            <div style={{ fontSize: '11px', color: '#5b8ab5', marginTop: '2px', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Assistant Genius Group
            </div>
          </div>
          <div style={{
            marginLeft: 'auto',
            background: 'rgba(201,162,39,0.15)',
            border: '1px solid #c9a227',
            color: '#c9a227',
            fontSize: '10px', fontWeight: '700',
            padding: '3px 10px', borderRadius: '20px',
            letterSpacing: '1.5px', textTransform: 'uppercase'
          }}>IA</div>
        </div>

        {/* Messages */}
        <div style={{
          padding: '20px', display: 'flex', flexDirection: 'column',
          gap: '14px', height: '320px', overflowY: 'auto',
          background: '#0a1628'
        }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '70%', padding: '11px 16px',
                borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                fontSize: '14px', lineHeight: '1.6',
                background: m.role === 'user'
                  ? 'linear-gradient(135deg, #b8891e, #c9a227)'
                  : '#0f2444',
                border: m.role === 'user' ? 'none' : '1px solid #1e3a5f',
                color: m.role === 'user' ? '#0a1628' : '#c8daf0',
                fontWeight: m.role === 'user' ? '600' : '400'
              }}>
                {m.texte}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                padding: '14px 16px', background: '#0f2444',
                border: '1px solid #1e3a5f', borderRadius: '14px 14px 14px 4px',
                display: 'flex', gap: '5px', alignItems: 'center'
              }}>
                {[0, 0.2, 0.4].map((delay, i) => (
                  <div key={i} style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: '#c9a227',
                    animation: `pulse 1.4s ease-in-out ${delay}s infinite`
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          background: '#0d1f3c', padding: '16px 20px',
          borderTop: '1px solid #1e3a5f',
          display: 'flex', gap: '12px', alignItems: 'center'
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && envoyer()}
            placeholder="Écris ta question..."
            style={{
              flex: 1, background: '#0a1628',
              border: '1px solid #1e3a5f', borderRadius: '10px',
              padding: '12px 16px', color: '#c8daf0',
              fontSize: '14px', outline: 'none',
              fontFamily: "'Lato', sans-serif"
            }}
          />
          <button
            onClick={envoyer}
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #b8891e, #c9a227)',
              border: 'none', borderRadius: '10px',
              padding: '12px 20px', color: '#0a1628',
              fontWeight: '700', fontSize: '13px',
              fontFamily: "'Lato', sans-serif",
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              letterSpacing: '0.5px'
            }}
          >
            Envoyer
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}