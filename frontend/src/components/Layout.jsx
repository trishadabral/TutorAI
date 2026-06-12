import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Upload,
  MessageSquare,
  Brain,
  Map,
  Search,
  Bell,
  Moon,
  Sun,
  BrainCircuit,
  FileText,
} from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', label: 'Upload', icon: Upload, key: 'upload' },
  { path: '/chat', label: 'Chat', icon: MessageSquare, key: 'chat' },
  { path: '/quiz', label: 'Quiz', icon: Brain, key: 'quiz' },
  { path: '/knowledge', label: 'Knowledge Map', icon: Map, key: 'map' },
]

export default function Layout({ children, documents, knowledgeState, pageMeta }) {
  const [isLight, setIsLight] = useState(() => {
    return localStorage.getItem('adaptivetutor-theme') === 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark')
    localStorage.setItem('adaptivetutor-theme', isLight ? 'light' : 'dark')
  }, [isLight])

  const activeNav = pageMeta?.nav || 'upload'

  /* knowledge score */
  const concepts = Object.entries(knowledgeState || {})
  const avgScore = concepts.length
    ? concepts.reduce((s, [, v]) => s + v, 0) / concepts.length
    : 0
  const scorePercent = Math.round(avgScore * 100)

  const indexedDocs = documents.filter(d => d.status === 'indexed')

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* ─── Background effects ─── */}
      <div className="bg-effects">
        <div className="bg-orb-tl" />
        <div className="bg-orb-br" />
        <div className="bg-grid" />
      </div>

      {/* ─── Sidebar ─── */}
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ padding: '24px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'linear-gradient(135deg, var(--purple), var(--violet))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 18px rgba(108,99,255,.35)',
          }}>
            <BrainCircuit size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)', lineHeight: 1.2 }}>
              AdaptiveTutor
            </div>
            <div style={{ fontSize: '.65rem', color: 'var(--muted)', letterSpacing: '.04em' }}>
              AI-powered learning
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 12px', overflowY: 'auto' }}>
          <div style={{ fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', padding: '12px 16px 6px', fontWeight: 600 }}>
            Workspace
          </div>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const isActive = activeNav === item.key
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-nav-item${isActive ? ' active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            )
          })}

          {/* Progress card */}
          <div style={{
            margin: '20px 4px 0',
            padding: '16px',
            borderRadius: 14,
            background: 'var(--surface-2)',
            border: '1px solid var(--line)',
          }}>
            <div style={{ fontSize: '.7rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
              Focus Progress
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>
                {scorePercent}%
              </span>
              <span style={{ fontSize: '.75rem', color: 'var(--muted)' }}>mastery</span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${scorePercent}%` }} />
            </div>
          </div>

          {/* Recent docs */}
          {indexedDocs.length > 0 && (
            <div style={{ margin: '16px 4px 0' }}>
              <div style={{ fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', padding: '8px 16px 6px', fontWeight: 600 }}>
                Documents
              </div>
              {indexedDocs.slice(0, 4).map((doc, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', fontSize: '.8rem', color: 'var(--muted)' }}>
                  <FileText size={13} style={{ color: 'var(--violet)', flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</span>
                </div>
              ))}
            </div>
          )}
        </nav>

        {/* Bottom: theme toggle */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.8rem', color: 'var(--muted)' }}>
            {isLight ? <Sun size={15} /> : <Moon size={15} />}
            <span>{isLight ? 'Light' : 'Dark'}</span>
          </div>
          <button
            className={`theme-toggle${isLight ? ' light' : ''}`}
            onClick={() => setIsLight(!isLight)}
            aria-label="Toggle theme"
          >
            <div className="theme-toggle-knob" />
          </button>
        </div>
      </aside>

      {/* ─── Main area ─── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <header style={{
          padding: '24px 32px 16px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--violet)', fontWeight: 600, marginBottom: 4 }}>
              {pageMeta?.eyebrow}
            </div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.65rem', color: 'var(--text)', lineHeight: 1.25, marginBottom: 4 }}>
              {pageMeta?.title}
            </h1>
            <p style={{ fontSize: '.85rem', color: 'var(--muted)', maxWidth: 520 }}>
              {pageMeta?.subtitle}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0, paddingTop: 4 }}>
            {/* Search */}
            <button style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'var(--surface)', border: '1px solid var(--line)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--muted)',
            }}>
              <Search size={16} />
            </button>
            {/* Bell */}
            <button style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'var(--surface)', border: '1px solid var(--line)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--muted)', position: 'relative',
            }}>
              <Bell size={16} />
              <span style={{
                position: 'absolute', top: 6, right: 7,
                width: 7, height: 7, borderRadius: '50%',
                background: 'var(--red)', border: '2px solid var(--surface)',
              }} />
            </button>
            {/* Avatar */}
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--purple), var(--violet))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '.8rem', color: '#fff',
            }}>
              AT
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '0 32px 32px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
