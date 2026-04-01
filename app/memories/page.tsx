'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, Brain, ChevronDown, ChevronRight } from 'lucide-react'

interface MemoryEntry {
  id: string
  date: string
  topic: string | null
  filename: string
  content: string
  wordCount: number
  type: 'daily' | 'topic' | 'detail' | 'longterm'
}

function renderMarkdown(md: string): string {
  // Simple markdown → HTML (no library needed for this use case)
  return md
    .replace(/^### (.+)$/gm, '<h3 style="color:#C9A84C;font-size:14px;font-weight:700;margin:16px 0 6px">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="color:white;font-size:16px;font-weight:700;margin:20px 0 8px">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="color:white;font-size:20px;font-weight:800;margin:20px 0 10px">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:white">$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="background:#111;padding:2px 6px;border-radius:3px;color:#C9A84C;font-size:12px;font-family:monospace">$1</code>')
    .replace(/^- (.+)$/gm, '<div style="display:flex;gap:8px;margin:3px 0"><span style="color:#C9A84C;flex-shrink:0">▸</span><span>$1</span></div>')
    .replace(/^(\d+)\. (.+)$/gm, '<div style="display:flex;gap:8px;margin:3px 0"><span style="color:#555;flex-shrink:0">$1.</span><span>$2</span></div>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
}

function groupByDate(entries: MemoryEntry[]): Record<string, MemoryEntry[]> {
  const groups: Record<string, MemoryEntry[]> = {}
  for (const entry of entries) {
    if (!groups[entry.date]) groups[entry.date] = []
    groups[entry.date].push(entry)
  }
  return groups
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (dateStr === today.toISOString().slice(0, 10)) return 'Today'
  if (dateStr === yesterday.toISOString().slice(0, 10)) return 'Yesterday'
  return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function MemoriesPage() {
  const [entries, setEntries] = useState<MemoryEntry[]>([])
  const [view, setView] = useState<'timeline' | 'longterm'>('timeline')
  const [query, setQuery] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [selected, setSelected] = useState<MemoryEntry | null>(null)
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 300)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/memories?view=${view}&q=${encodeURIComponent(debouncedQ)}`)
      .then(r => r.json())
      .then(data => {
        setEntries(data)
        setSelected(null)
        // Auto-expand today and yesterday
        const today = new Date().toISOString().slice(0, 10)
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
        setExpandedDates(new Set([today, yesterday]))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [view, debouncedQ])

  const grouped = useMemo(() => groupByDate(entries), [entries])
  const sortedDates = Object.keys(grouped).sort().reverse()

  const toggleDate = (date: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev)
      if (next.has(date)) next.delete(date)
      else next.add(date)
      return next
    })
  }

  const typeColor = (type: string) => ({
    daily: '#4A90D9',
    topic: '#C9A84C',
    detail: '#A855F7',
    longterm: '#4CAF50',
  }[type] || '#737373')

  const typeLabel = (type: string, topic: string | null) => {
    if (type === 'longterm') return 'Long-term Index'
    if (type === 'detail') return 'Detail'
    if (type === 'daily') return 'Daily Summary'
    return topic || 'Session'
  }

  return (
    <div style={{ display: 'flex', gap: '0', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>

      {/* Left panel */}
      <div style={{ width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #2A2A2A', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '0 0 16px 0', borderBottom: '1px solid #2A2A2A', flexShrink: 0 }}>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>Memories</h1>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search memories..."
              style={{
                width: '100%', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A',
                borderRadius: '6px', padding: '7px 10px 7px 32px', color: 'white',
                fontSize: '13px', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['timeline', 'longterm'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                flex: 1, padding: '6px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                border: `1px solid ${view === v ? '#C9A84C' : '#2A2A2A'}`,
                backgroundColor: view === v ? 'rgba(201,168,76,0.1)' : 'transparent',
                color: view === v ? '#C9A84C' : '#737373',
              }}>
                {v === 'timeline' ? '📅 Timeline' : '🧠 Long-term'}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflow: 'auto', paddingTop: '8px' }}>
          {loading && <div style={{ color: '#555', fontSize: '13px', textAlign: 'center', paddingTop: '24px' }}>Loading...</div>}

          {!loading && entries.length === 0 && (
            <div style={{ color: '#555', fontSize: '13px', textAlign: 'center', paddingTop: '24px' }}>
              {query ? `No results for "${query}"` : 'No memories found'}
            </div>
          )}

          {view === 'timeline' && sortedDates.map(date => (
            <div key={date}>
              {/* Date header */}
              <button
                onClick={() => toggleDate(date)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 4px', background: 'none', border: 'none', cursor: 'pointer',
                  color: '#737373', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {expandedDates.has(date) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                {formatDateLabel(date)}
                <span style={{ marginLeft: 'auto', color: '#444', fontWeight: '400' }}>{grouped[date].length}</span>
              </button>

              {expandedDates.has(date) && grouped[date].map(entry => (
                <div
                  key={entry.id}
                  onClick={() => setSelected(entry)}
                  style={{
                    padding: '8px 8px 8px 16px',
                    marginBottom: '2px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: selected?.id === entry.id ? '#1E1E1E' : 'transparent',
                    borderLeft: `2px solid ${selected?.id === entry.id ? typeColor(entry.type) : 'transparent'}`,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (selected?.id !== entry.id) (e.currentTarget as HTMLElement).style.backgroundColor = '#181818' }}
                  onMouseLeave={e => { if (selected?.id !== entry.id) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: typeColor(entry.type), flexShrink: 0 }} />
                    <span style={{ color: 'white', fontSize: '12px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.topic || 'Daily Summary'}
                    </span>
                  </div>
                  <div style={{ color: '#555', fontSize: '11px', paddingLeft: '12px' }}>{entry.wordCount} words · {entry.type}</div>
                </div>
              ))}
            </div>
          ))}

          {view === 'longterm' && entries.map(entry => (
            <div
              key={entry.id}
              onClick={() => setSelected(entry)}
              style={{
                padding: '12px 8px',
                marginBottom: '4px',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: selected?.id === entry.id ? '#1E1E1E' : 'transparent',
                borderLeft: `2px solid ${selected?.id === entry.id ? typeColor(entry.type) : 'transparent'}`,
              }}
              onMouseEnter={e => { if (selected?.id !== entry.id) (e.currentTarget as HTMLElement).style.backgroundColor = '#181818' }}
              onMouseLeave={e => { if (selected?.id !== entry.id) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: typeColor(entry.type) }} />
                <span style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>{entry.topic}</span>
              </div>
              <div style={{ color: '#555', fontSize: '11px', paddingLeft: '14px' }}>{entry.wordCount} words · {entry.filename}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel: content viewer */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 0 0 28px' }}>
        {!selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#555' }}>
            <Brain size={40} style={{ marginBottom: '16px', color: '#2A2A2A' }} />
            <div style={{ fontSize: '14px' }}>Select a memory to read it</div>
            <div style={{ fontSize: '12px', marginTop: '6px' }}>{entries.length} entries loaded</div>
          </div>
        ) : (
          <div>
            {/* Entry header */}
            <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #2A2A2A' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: typeColor(selected.type) }} />
                <span style={{ color: '#737373', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>
                  {typeLabel(selected.type, selected.topic)}
                </span>
              </div>
              <h2 style={{ color: 'white', fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>
                {selected.topic || formatDateLabel(selected.date)}
              </h2>
              <div style={{ display: 'flex', gap: '16px', color: '#555', fontSize: '12px' }}>
                <span>📅 {formatDateLabel(selected.date)}</span>
                <span>📄 {selected.filename}</span>
                <span>✏️ {selected.wordCount} words</span>
              </div>
            </div>

            {/* Rendered content */}
            <div
              style={{ color: '#aaa', fontSize: '13px', lineHeight: '1.8', maxWidth: '720px' }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(selected.content) }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
