import { useState, useRef, useEffect } from 'react'
import { Send, FileText } from 'lucide-react'

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '12px 16px' }}>
      {[0, 1, 2].map(i => (
        <div key={i} className="bounce-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--purple)' }} />
      ))}
    </div>
  )
}

export default function Chat({ sessionId, apiBase, onKnowledgeUpdate }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm your AdaptiveTutor. Ask me anything about your uploaded study materials and I'll provide cited answers.",
      sources: [],
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const endRef = useRef(null)

  const scroll = () => endRef.current?.scrollIntoView({ behavior: 'smooth' })
  useEffect(scroll, [messages, isLoading])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    const question = input.trim()
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch(`${apiBase}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, session_id: sessionId }),
      })
      const data = await res.json()
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer || 'Sorry, I could not generate a response.',
          sources: data.sources || [],
        },
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Error connecting to the backend. Ensure the server is running on port 8000.', sources: [] },
      ])
    }
    setIsLoading(false)
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="glass" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', maxWidth: 820, margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        padding: '18px 24px',
        borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: '.6rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--mint)', fontWeight: 600, marginBottom: 2 }}>
            AI companion
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>
            Ask Smarter
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="pulse-dot" />
          <span style={{ fontSize: '.7rem', color: 'var(--mint)', fontWeight: 600 }}>Live</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user'
          return (
            <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '80%' }}>
                <div className={isUser ? 'chat-bubble-user' : 'chat-bubble-bot'}>
                  {msg.content}
                </div>
                {!isUser && msg.sources && msg.sources.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {msg.sources.map((page, j) => (
                      <span key={j} className="citation-pill">
                        <FileText size={10} />
                        Page {page}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div className="chat-bubble-bot" style={{ padding: 0 }}>
              <TypingIndicator />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--line)' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 12,
          background: 'var(--surface-2)', border: '1px solid var(--line)',
          borderRadius: 14, padding: '10px 14px',
        }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your study materials..."
            rows={1}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              resize: 'none', fontFamily: 'var(--font-body)', fontSize: '.85rem',
              color: 'var(--text)', maxHeight: 120, minHeight: 36, lineHeight: 1.5,
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'var(--purple)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, opacity: !input.trim() || isLoading ? 0.4 : 1,
              transition: 'opacity .2s',
            }}
          >
            <Send size={16} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  )
}
