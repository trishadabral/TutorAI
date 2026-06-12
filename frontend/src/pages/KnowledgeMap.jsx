import { useState, useEffect, useMemo } from 'react'
import { Maximize2, Brain, RefreshCw } from 'lucide-react'

function getColor(score) {
  if (score >= 0.7) return 'var(--mint)'
  if (score >= 0.4) return 'var(--amber)'
  return 'var(--red)'
}

/* ─── SVG Radar Chart (hexagonal) ─── */
function RadarChart({ data }) {
  const cx = 150, cy = 150, r = 110
  const n = data.length

  const pointOnAxis = (i, fraction) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    return { x: cx + r * fraction * Math.cos(angle), y: cy + r * fraction * Math.sin(angle) }
  }

  const gridLevels = [0.25, 0.5, 0.75, 1]

  const dataPoints = data.map((d, i) => pointOnAxis(i, d.score))
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

  return (
    <svg viewBox="0 0 300 300" style={{ width: '100%', maxWidth: 300 }}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Grid rings */}
      {gridLevels.map(level => {
        const pts = Array.from({ length: n }, (_, i) => pointOnAxis(i, level))
        const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
        return <path key={level} d={path} fill="none" stroke="var(--line)" strokeWidth="1" />
      })}

      {/* Axis lines */}
      {Array.from({ length: n }, (_, i) => {
        const end = pointOnAxis(i, 1)
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="var(--line)" strokeWidth="1" />
      })}

      {/* Data polygon */}
      <path d={dataPath} fill="rgba(108,99,255,.18)" stroke="var(--purple)" strokeWidth="2" filter="url(#glow)" />

      {/* Glow dots on vertices */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--purple)" filter="url(#glow)" />
      ))}

      {/* Labels */}
      {data.map((d, i) => {
        const labelPt = pointOnAxis(i, 1.22)
        return (
          <text key={i} x={labelPt.x} y={labelPt.y} textAnchor="middle" dominantBaseline="central"
            style={{ fontSize: '10px', fill: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
            {d.label}
          </text>
        )
      })}
    </svg>
  )
}

export default function KnowledgeMap({ sessionId, knowledgeState, onRefresh }) {
  const [animatedScores, setAnimatedScores] = useState({})

  const concepts = useMemo(() => Object.entries(knowledgeState || {}), [knowledgeState])

  const radarData = useMemo(() => {
    const items = concepts.slice(0, 8)
    if (!items.length) return []
    return items.map(([name, score]) => ({
      label: name.length > 12 ? name.slice(0, 12) + '…' : name,
      score: Math.max(score, 0.05),
    }))
  }, [concepts])

  useEffect(() => {
    const t = setTimeout(() => setAnimatedScores(knowledgeState || {}), 150)
    return () => clearTimeout(t)
  }, [knowledgeState])

  const avgScore = concepts.length ? concepts.reduce((s, [, v]) => s + v, 0) / concepts.length : 0

  return (
    <div className="glass" style={{ padding: 28, maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: '.6rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--violet)', fontWeight: 600, marginBottom: 2 }}>
            Mastery intelligence
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.15rem', color: 'var(--text)' }}>
            Knowledge Map
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onRefresh} style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--surface-2)', border: '1px solid var(--line)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--muted)',
          }}>
            <RefreshCw size={15} />
          </button>
          <button style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--surface-2)', border: '1px solid var(--line)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--muted)',
          }}>
            <Maximize2 size={15} />
          </button>
        </div>
      </div>

      {concepts.length === 0 ? (
        /* Empty state */
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Brain size={44} style={{ color: 'var(--muted)', opacity: 0.3, margin: '0 auto 16px', display: 'block' }} />
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1.1rem', color: 'var(--text)', marginBottom: 6 }}>
            No data yet
          </p>
          <p style={{ fontSize: '.85rem', color: 'var(--muted)', maxWidth: 380, margin: '0 auto' }}>
            Upload documents and take quizzes to build your personalised knowledge map.
          </p>
        </div>
      ) : (
        /* 2-column: radar + bars */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* Radar */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '8px 0' }}>
            <RadarChart data={radarData} />
          </div>

          {/* Concept bars */}
          <div>
            <div style={{ fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', fontWeight: 600, marginBottom: 16 }}>
              Concept Mastery
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {concepts
                .sort((a, b) => b[1] - a[1])
                .map(([name, score]) => {
                  const color = getColor(score)
                  const animScore = animatedScores[name] ?? 0
                  const pct = Math.round(animScore * 100)
                  return (
                    <div key={name}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: '.8rem', fontWeight: 500, color: 'var(--text)' }}>
                          {name}
                        </span>
                        <span style={{ fontSize: '.8rem', fontWeight: 700, color }}>{pct}%</span>
                      </div>
                      <div className="progress-bar-track">
                        <div style={{
                          height: '100%', borderRadius: 999,
                          background: color,
                          width: `${pct}%`,
                          transition: 'width .8s ease',
                        }} />
                      </div>
                    </div>
                  )
                })}
            </div>

            {/* Summary */}
            <div style={{
              marginTop: 20, padding: '14px 16px', borderRadius: 14,
              background: 'var(--surface-2)', border: '1px solid var(--line)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>Average mastery</span>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>
                {Math.round(avgScore * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
