import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import Upload from './pages/Upload'
import Chat from './pages/Chat'
import Quiz from './pages/Quiz'
import KnowledgeMap from './pages/KnowledgeMap'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export const PAGE_META = {
  '/': {
    eyebrow: 'Learning workspace',
    title: 'Upload knowledge. Unlock answers.',
    subtitle: 'Import PDFs and let the AI index every concept for instant recall.',
    nav: 'upload',
  },
  '/chat': {
    eyebrow: 'AI study companion',
    title: 'Ask better questions.',
    subtitle: 'Chat with your documents and get cited, contextual answers.',
    nav: 'chat',
  },
  '/quiz': {
    eyebrow: 'Adaptive practice',
    title: 'Train where it matters.',
    subtitle: 'Auto-generated MCQs that adapt to your weakest concepts.',
    nav: 'quiz',
  },
  '/knowledge': {
    eyebrow: 'Mastery intelligence',
    title: 'See how you learn.',
    subtitle: 'Visualise your strengths and gaps across every topic.',
    nav: 'map',
  },
}

function getSessionId() {
  const stored = localStorage.getItem('adaptivetutor_session')
  if (stored) return stored
  const newId = crypto.randomUUID()
  localStorage.setItem('adaptivetutor_session', newId)
  return newId
}

function App() {
  const location = useLocation()
  const [sessionId] = useState(getSessionId)
  const [documents, setDocuments] = useState([])
  const [knowledgeState, setKnowledgeState] = useState({})

  const fetchKnowledge = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/knowledge/${sessionId}`)
      if (res.ok) {
        const data = await res.json()
        setKnowledgeState(data.concepts || {})
      }
    } catch (e) {
      console.error('Failed to fetch knowledge:', e)
    }
  }, [sessionId])

  useEffect(() => {
    fetchKnowledge()
  }, [fetchKnowledge])

  const handleUpload = async (file) => {
    const formData = new FormData()
    formData.append('file', file)

    const tempDoc = { name: file.name, size: file.size, status: 'indexing', chunks: 0 }
    setDocuments(prev => [tempDoc, ...prev])

    try {
      const res = await fetch(`${API_BASE}/upload?session_id=${sessionId}`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.detail || 'Upload failed')

      if (data.chunks_indexed > 0) {
        setDocuments(prev =>
          prev.map(d =>
            d.name === file.name
              ? { ...d, status: 'indexed', chunks: data.chunks_indexed }
              : d
          )
        )
        fetchKnowledge()
        return data
      }
      throw new Error('No text extracted')
    } catch (e) {
      setDocuments(prev =>
        prev.map(d =>
          d.name === file.name ? { ...d, status: 'failed', error: e.message } : d
        )
      )
      return null
    }
  }

  const pageMeta = PAGE_META[location.pathname] || PAGE_META['/']

  return (
    <Layout
      documents={documents}
      knowledgeState={knowledgeState}
      pageMeta={pageMeta}
    >
      <Routes>
        <Route path="/" element={<Upload documents={documents} onUpload={handleUpload} />} />
        <Route path="/chat" element={<Chat sessionId={sessionId} apiBase={API_BASE} onKnowledgeUpdate={fetchKnowledge} />} />
        <Route path="/quiz" element={<Quiz sessionId={sessionId} apiBase={API_BASE} knowledgeState={knowledgeState} onKnowledgeUpdate={fetchKnowledge} />} />
        <Route path="/knowledge" element={<KnowledgeMap sessionId={sessionId} knowledgeState={knowledgeState} onRefresh={fetchKnowledge} />} />
      </Routes>
    </Layout>
  )
}

export default App
