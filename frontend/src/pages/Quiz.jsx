import { useState } from 'react'
import { Brain, CheckCircle, XCircle, ArrowRight, Zap } from 'lucide-react'

const DIFF_BADGE = {
  conceptual: { label: 'Conceptual', bg: 'rgba(52,211,153,.12)', color: 'var(--mint)' },
  application: { label: 'Application', bg: 'rgba(251,191,36,.12)', color: 'var(--amber)' },
  analytical: { label: 'Analytical', bg: 'rgba(248,113,113,.12)', color: 'var(--red)' },
}

export default function Quiz({ sessionId, apiBase, knowledgeState, onKnowledgeUpdate }) {
  const [topic, setTopic] = useState('')
  const [mcq, setMcq] = useState(null)
  const [selected, setSelected] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [correct, setCorrect] = useState(false)
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [right, setRight] = useState(0)
  const [streak, setStreak] = useState(0)

  const concepts = Object.keys(knowledgeState || {})

  const fetchMCQ = async (t) => {
    setLoading(true)
    setSelected(null)
    setShowResult(false)
    setMcq(null)
    try {
      const res = await fetch(`${apiBase}/mcq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: t, session_id: sessionId }),
      })
      const data = await res.json()
      if (data.question) setMcq(data)
    } catch (e) {
      console.error('MCQ fetch error:', e)
    }
    setLoading(false)
  }

  const submitAnswer = async () => {
    if (selected === null || !mcq) return
    const isCorrect = selected === mcq.correct
    setCorrect(isCorrect)
    setShowResult(true)
    setTotal(p => p + 1)
    if (isCorrect) { setStreak(p => p + 1); setRight(p => p + 1) }
    else setStreak(0)

    try {
      await fetch(`${apiBase}/mcq/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, concept: mcq.concept || topic, correct: isCorrect }),
      })
      onKnowledgeUpdate()
    } catch (e) {
      console.error('Answer submit error:', e)
    }
  }

  const handleTopicSubmit = e => { e.preventDefault(); if (topic.trim()) fetchMCQ(topic.trim()) }

  const badge = DIFF_BADGE[mcq?.difficulty] || DIFF_BADGE.application
  const options = mcq?.options || {}
  const entries = Object.entries(options)

  const getOptionClass = (letter) => {
    if (!showResult) return selected === letter ? 'quiz-option selected' : 'quiz-option'
    if (letter === mcq.correct) return 'quiz-option correct'
    if (letter === selected && !correct) return 'quiz-option wrong'
    return 'quiz-option'
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Topic input */}
      {!mcq && !loading && (
        <div className="glass" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'rgba(108,99,255,.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Brain size={26} style={{ color: 'var(--purple)' }} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.4rem', color: 'var(--text)', marginBottom: 6 }}>
            Adaptive Practice
          </h2>
          <p style={{ fontSize: '.85rem', color: 'var(--muted)', marginBottom: 24, maxWidth: 420, margin: '0 auto 24px' }}>
            Enter a topic and difficulty adapts to your knowledge level.
          </p>
          <form onSubmit={handleTopicSubmit} style={{ display: 'flex', gap: 10, maxWidth: 440, margin: '0 auto' }}>
            <input
              type="text" value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="Enter a topic..."
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 12,
                background: 'var(--surface-2)', border: '1px solid var(--line)',
                color: 'var(--text)', fontSize: '.85rem', fontFamily: 'var(--font-body)', outline: 'none',
              }}
            />
            <button type="submit" disabled={!topic.trim()} style={{
              padding: '10px 24px', borderRadius: 12,
              background: 'var(--purple)', color: '#fff', fontSize: '.85rem', fontWeight: 600,
              border: 'none', cursor: 'pointer', opacity: !topic.trim() ? 0.4 : 1,
            }}>
              Generate
            </button>
          </form>
          {concepts.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: '.7rem', color: 'var(--muted)', marginBottom: 8 }}>Or pick from your topics:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                {concepts.slice(0, 8).map(c => (
                  <button key={c} onClick={() => { setTopic(c); fetchMCQ(c) }} style={{
                    padding: '5px 12px', borderRadius: 8, fontSize: '.75rem',
                    background: 'var(--surface-2)', border: '1px solid var(--line)',
                    color: 'var(--muted)', cursor: 'pointer',
                  }}>{c}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="glass" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '3px solid var(--purple)', borderTopColor: 'transparent',
            animation: 'spin .8s linear infinite', margin: '0 auto 16px',
          }} />
          <p style={{ color: 'var(--muted)', fontSize: '.85rem' }}>Generating your question...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {/* MCQ */}
      {mcq && !loading && (
        <div className="glass" style={{ padding: 28 }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: '.6rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--violet)', fontWeight: 600, marginBottom: 2 }}>Adaptive drill</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>Test your knowledge</div>
            </div>
            <span style={{
              padding: '4px 12px', borderRadius: 999, fontSize: '.7rem', fontWeight: 600,
              background: badge.bg, color: badge.color,
            }}>{badge.label}</span>
          </div>

          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Zap size={14} style={{ color: 'var(--amber)' }} />
              <span style={{ fontSize: '.8rem', fontWeight: 500, color: 'var(--text)' }}>Streak: {streak}</span>
            </div>
            <div className="progress-bar-track" style={{ flex: 1 }}>
              <div className="progress-bar-fill" style={{ width: total > 0 ? `${(right / total) * 100}%` : '0%' }} />
            </div>
            <span style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--text)' }}>{right}/{total}</span>
          </div>

          {/* Question */}
          <div style={{
            padding: '18px 20px', borderRadius: 14,
            background: 'var(--surface-2)', border: '1px solid var(--line)',
            marginBottom: 20,
          }}>
            <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1rem', lineHeight: 1.6, color: 'var(--text)' }}>
              {mcq.question}
            </p>
          </div>

          {/* 2x2 Options grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {entries.map(([letter, text]) => (
              <button
                key={letter}
                className={getOptionClass(letter)}
                onClick={() => !showResult && setSelected(letter)}
                disabled={showResult}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '.85rem', fontWeight: 700,
                  background: selected === letter && !showResult ? 'var(--purple)' : 'var(--surface)',
                  color: selected === letter && !showResult ? '#fff' : 'var(--text)',
                  border: selected === letter && !showResult ? 'none' : '1px solid var(--line)',
                }}>
                  {letter}
                </div>
                <span style={{ flex: 1 }}>{text}</span>
                {showResult && letter === mcq.correct && <CheckCircle size={18} style={{ color: 'var(--mint)', flexShrink: 0 }} />}
                {showResult && letter === selected && !correct && letter !== mcq.correct && <XCircle size={18} style={{ color: 'var(--red)', flexShrink: 0 }} />}
              </button>
            ))}
          </div>

          {/* Submit / Next */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            {!showResult ? (
              <button onClick={submitAnswer} disabled={selected === null} style={{
                padding: '10px 24px', borderRadius: 12,
                background: 'var(--purple)', color: '#fff', fontSize: '.85rem', fontWeight: 600,
                border: 'none', cursor: 'pointer', opacity: selected === null ? 0.4 : 1,
              }}>Submit Answer</button>
            ) : (
              <button onClick={() => fetchMCQ(topic)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 24px', borderRadius: 12,
                background: 'var(--purple)', color: '#fff', fontSize: '.85rem', fontWeight: 600,
                border: 'none', cursor: 'pointer',
              }}>Next Question <ArrowRight size={15} /></button>
            )}
          </div>

          {/* Explanation */}
          {showResult && (
            <div style={{
              marginTop: 16, padding: '16px 20px', borderRadius: 14,
              background: 'var(--surface-2)',
              borderLeft: `4px solid ${correct ? 'var(--mint)' : 'var(--red)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                {correct ? <CheckCircle size={16} style={{ color: 'var(--mint)' }} /> : <XCircle size={16} style={{ color: 'var(--red)' }} />}
                <span style={{ fontWeight: 600, fontSize: '.85rem', color: correct ? 'var(--mint)' : 'var(--red)' }}>
                  {correct ? 'Correct!' : 'Incorrect'}
                </span>
              </div>
              <p style={{ fontSize: '.8rem', lineHeight: 1.6, color: 'var(--muted)' }}>{mcq.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
