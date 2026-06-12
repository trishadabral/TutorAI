import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload as UploadIcon, FileText, CheckCircle, Sparkles, ArrowRight, Files, Clock, TrendingUp } from 'lucide-react'

function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

function fileColor(name) {
  if (!name) return 'var(--purple)'
  const ext = name.split('.').pop().toLowerCase()
  if (ext === 'pdf') return 'var(--red)'
  if (['doc', 'docx'].includes(ext)) return 'var(--purple)'
  if (['xls', 'xlsx'].includes(ext)) return 'var(--mint)'
  return 'var(--amber)'
}

export default function Upload({ documents, onUpload }) {
  const [isDragging, setIsDragging] = useState(false)
  const navigate = useNavigate()

  const handleDragOver = useCallback(e => { e.preventDefault(); setIsDragging(true) }, [])
  const handleDragLeave = useCallback(e => { e.preventDefault(); setIsDragging(false) }, [])
  const handleDrop = useCallback(e => {
    e.preventDefault()
    setIsDragging(false)
    Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf').forEach(f => onUpload(f))
  }, [onUpload])
  const handleFileSelect = useCallback(e => {
    Array.from(e.target.files).filter(f => f.type === 'application/pdf').forEach(f => onUpload(f))
    e.target.value = ''
  }, [onUpload])

  const indexedCount = documents.filter(d => d.status === 'indexed').length
  const lastSync = documents.length ? 'Just now' : '—'
  const hasReady = documents.some(d => d.status === 'indexed')

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.9fr', gap: 24, alignItems: 'start' }}>
      {/* ─── LEFT: Upload Panel ─── */}
      <div className="glass" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--violet)', fontWeight: 600, marginBottom: 4 }}>
              Document intake
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.35rem', color: 'var(--text)' }}>
              Import your resources
            </h2>
            <p style={{ fontSize: '.8rem', color: 'var(--muted)', marginTop: 4 }}>
              Drag PDFs into the zone below. We chunk, embed and index automatically.
            </p>
          </div>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 10,
            background: 'linear-gradient(135deg, var(--purple), var(--violet))',
            color: '#fff', fontSize: '.8rem', fontWeight: 600,
            border: 'none', cursor: 'pointer',
            boxShadow: '0 0 16px rgba(108,99,255,.25)',
          }}>
            <Sparkles size={14} />
            Smart Import
          </button>
        </div>

        {/* Upload zone */}
        <div
          className={`upload-zone${isDragging ? ' dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input').click()}
        >
          <input id="file-input" type="file" accept=".pdf" multiple style={{ display: 'none' }} onChange={handleFileSelect} />
          <div className="upload-icon-float" style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'rgba(108,99,255,.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <UploadIcon size={24} style={{ color: 'var(--purple)' }} />
          </div>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1.05rem', color: 'var(--text)', marginBottom: 4 }}>
            {isDragging ? 'Drop your PDFs here' : 'Drag & drop files here'}
          </p>
          <p style={{ fontSize: '.8rem', color: 'var(--muted)', marginBottom: 16 }}>
            Supports PDF documents up to 50 MB
          </p>
          <button
            onClick={e => { e.stopPropagation(); document.getElementById('file-input').click() }}
            style={{
              padding: '10px 24px', borderRadius: 10,
              background: 'var(--purple)', color: '#fff',
              fontSize: '.8rem', fontWeight: 600,
              border: 'none', cursor: 'pointer',
              boxShadow: '0 0 14px rgba(108,99,255,.25)',
            }}
          >
            Choose Files
          </button>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 20 }}>
          {[
            { icon: Files, label: 'Files', value: indexedCount, color: 'var(--purple)' },
            { icon: Clock, label: 'Last sync', value: lastSync, color: 'var(--violet)' },
            { icon: TrendingUp, label: 'Score', value: indexedCount > 0 ? 'Ready' : '—', color: 'var(--mint)' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} style={{
              padding: '14px 16px', borderRadius: 14,
              background: 'var(--surface-2)', border: '1px solid var(--line)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Icon size={14} style={{ color }} />
                <span style={{ fontSize: '.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>{label}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Document list */}
        {documents.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', fontWeight: 600, marginBottom: 10 }}>
              Recent uploads
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {documents.map((doc, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 12,
                  background: 'var(--surface-2)', border: '1px solid var(--line)',
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: `${fileColor(doc.name)}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <FileText size={16} style={{ color: fileColor(doc.name) }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '.85rem', fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.name}
                    </div>
                    <div style={{ fontSize: '.7rem', color: 'var(--muted)' }}>
                      {formatSize(doc.size)}{doc.chunks ? ` · ${doc.chunks} chunks` : ''}
                    </div>
                  </div>
                  {doc.status === 'indexed' && <span className="badge-indexed"><CheckCircle size={11} /> Indexed ✓</span>}
                  {doc.status === 'indexing' && <span className="badge-indexing">Indexing…</span>}
                  {doc.status === 'failed' && <span className="badge-failed">Failed</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {hasReady && (
          <button
            onClick={() => navigate('/chat')}
            style={{
              marginTop: 20, width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px 0', borderRadius: 12,
              background: 'linear-gradient(135deg, var(--purple), var(--violet))',
              color: '#fff', fontSize: '.85rem', fontWeight: 600,
              border: 'none', cursor: 'pointer',
              boxShadow: '0 0 20px rgba(108,99,255,.25)',
            }}
          >
            Start studying <ArrowRight size={16} />
          </button>
        )}
      </div>

      {/* ─── RIGHT: Quick-glance panels ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Chat preview card */}
        <div className="glass" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: '.6rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--mint)', fontWeight: 600, marginBottom: 2 }}>AI companion</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)' }}>Ask Smarter</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="pulse-dot" />
              <span style={{ fontSize: '.7rem', color: 'var(--mint)', fontWeight: 600 }}>Live</span>
            </div>
          </div>
          <div className="chat-bubble-bot" style={{ marginBottom: 8, fontSize: '.8rem' }}>
            Upload a document and I'll answer any question with page citations!
          </div>
          <button onClick={() => navigate('/chat')} style={{
            marginTop: 8, width: '100%', padding: '8px 0', borderRadius: 10,
            background: 'var(--surface-2)', border: '1px solid var(--line)',
            color: 'var(--purple)', fontSize: '.8rem', fontWeight: 600,
            cursor: 'pointer',
          }}>
            Open Chat <ArrowRight size={13} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
          </button>
        </div>

        {/* Quiz preview card */}
        <div className="glass" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: '.6rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--amber)', fontWeight: 600, marginBottom: 2 }}>Adaptive drills</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)' }}>Practice Quiz</div>
            </div>
            <span style={{
              padding: '3px 10px', borderRadius: 999, fontSize: '.65rem', fontWeight: 600,
              background: 'rgba(248,113,113,.12)', color: 'var(--red)',
            }}>Analytical</span>
          </div>
          <p style={{ fontSize: '.8rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: 10 }}>
            MCQs adapt to your mastery — the weaker the concept, the harder the question.
          </p>
          <button onClick={() => navigate('/quiz')} style={{
            width: '100%', padding: '8px 0', borderRadius: 10,
            background: 'var(--surface-2)', border: '1px solid var(--line)',
            color: 'var(--purple)', fontSize: '.8rem', fontWeight: 600,
            cursor: 'pointer',
          }}>
            Start a Quiz <ArrowRight size={13} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
          </button>
        </div>

        {/* Knowledge Map preview card */}
        <div className="glass" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: '.6rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--violet)', fontWeight: 600, marginBottom: 2 }}>Intelligence</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)' }}>Knowledge Map</div>
            </div>
          </div>
          <p style={{ fontSize: '.8rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: 10 }}>
            Visualise your strengths and gaps with radar charts and concept bars.
          </p>
          <button onClick={() => navigate('/knowledge')} style={{
            width: '100%', padding: '8px 0', borderRadius: 10,
            background: 'var(--surface-2)', border: '1px solid var(--line)',
            color: 'var(--purple)', fontSize: '.8rem', fontWeight: 600,
            cursor: 'pointer',
          }}>
            View Map <ArrowRight size={13} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
          </button>
        </div>
      </div>
    </div>
  )
}
