'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, FileText, Copy, Check, ExternalLink, Filter } from 'lucide-react'

interface Doc {
  id: string
  title: string
  type: string
  project: string
  tags: string[]
  filePath: string
  createdAt: string
  updatedAt: string
  description: string
  content?: string
}

const TYPE_META: Record<string, { color: string; label: string }> = {
  architecture:   { color: '#C9A84C', label: 'Architecture' },
  strategy:       { color: '#A855F7', label: 'Strategy' },
  intel:          { color: '#4A90D9', label: 'Intel' },
  'meeting-prep': { color: '#4CAF50', label: 'Meeting Prep' },
  playbook:       { color: '#F97316', label: 'Playbook' },
  operations:     { color: '#06B6D4', label: 'Operations' },
  marketing:      { color: '#EC4899', label: 'Marketing' },
  analysis:       { color: '#84CC16', label: 'Analysis' },
}

const ALL_TYPES = Object.keys(TYPE_META)

function renderMarkdown(md: string): string {
  return md
    .replace(/^#### (.+)$/gm, '<h4 style="color:#aaa;font-size:13px;font-weight:700;margin:14px 0 4px;text-transform:uppercase;letter-spacing:0.05em">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 style="color:#C9A84C;font-size:14px;font-weight:700;margin:18px 0 6px">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="color:white;font-size:17px;font-weight:700;margin:22px 0 8px;padding-bottom:6px;border-bottom:1px solid #2A2A2A">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="color:white;font-size:22px;font-weight:800;margin:0 0 12px">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:white;font-weight:700">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="color:#aaa">$1</em>')
    .replace(/`([^`\n]+)`/g, '<code style="background:#111;padding:2px 6px;border-radius:3px;color:#C9A84C;font-size:12px;font-family:monospace">$1</code>')
    .replace(/^```[\w]*\n([\s\S]*?)^```/gm, '<pre style="background:#111;border:1px solid #2A2A2A;border-radius:6px;padding:12px;overflow-x:auto;font-family:monospace;font-size:12px;color:#aaa;margin:12px 0"><code>$1</code></pre>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #2A2A2A;margin:16px 0"/>')
    .replace(/^\| (.+)$/gm, (line) => {
      const cells = line.split('|').filter(Boolean).map(c => c.trim())
      if (cells.every(c => /^[-:]+$/.test(c))) return ''
      return '<tr>' + cells.map(c => `<td style="padding:6px 12px;border-bottom:1px solid #222;color:#aaa;font-size:12px">${c}</td>`).join('') + '</tr>'
    })
    .replace(/(<tr>.*<\/tr>\n?)+/gs, m => `<table style="width:100%;border-collapse:collapse;margin:12px 0;background:#181818;border-radius:6px;overflow:hidden">${m}</table>`)
    .replace(/^- (.+)$/gm, '<div style="display:flex;gap:8px;margin:4px 0;padding-left:4px"><span style="color:#C9A84C;flex-shrink:0;margin-top:1px">▸</span><span style="color:#aaa">$1</span></div>')
    .replace(/^\d+\. (.+)$/gm, '<div style="display:flex;gap:8px;margin:4px 0;padding-left:4px;color:#aaa"><span>$1</span></div>')
    .replace(/\n\n/g, '<br/>')
    .replace(/\n(?!<)/g, '<br/>')
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}

export default function DocsPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [selected, setSelected] = useState<Doc | null>(null)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [contentLoading, setContentLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const loadDocs = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (typeFilter) params.set('type', typeFilter)
    const res = await fetch(`/api/docs?${params}`)
    const data = await res.json()
    setDocs(data)
    setLoading(false)
  }, [query, typeFilter])

  useEffect(() => {
    const t = setTimeout(loadDocs, 250)
    return () => clearTimeout(t)
  }, [loadDocs])

  const openDoc = async (doc: Doc) => {
    setSelected({ ...doc, content: undefined })
    setContentLoading(true)
    const res = await fetch(`/api/docs/${doc.id}`)
    const data = await res.json()
    setSelected(data)
    setContentLoading(false)
  }

  const copyContent = () => {
    if (!selected?.content) return
    navigator.clipboard.writeText(selected.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const typeMeta = (type: string) => TYPE_META[type] || { color: '#737373', label: type }

  return (
    <div style={{ display: 'flex', gap: '0', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>

      {/* Left panel */}
      <div style={{ width: '360px', flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #2A2A2A', overflow: 'hidden' }}>

        {/* Header + search */}
        <div style={{ padding: '0 0 16px 0', borderBottom: '1px solid #2A2A2A', flexShrink: 0 }}>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>Docs</h1>

          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by title, keyword, project..."
              style={{
                width: '100%', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A',
                borderRadius: '6px', padding: '7px 10px 7px 32px', color: 'white',
                fontSize: '13px', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(f => !f)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: typeFilter ? '#C9A84C' : '#555', cursor: 'pointer', fontSize: '12px', padding: '0' }}
          >
            <Filter size={12} /> {typeFilter ? `Type: ${typeMeta(typeFilter).label}` : 'Filter by type'} {showFilters ? '▲' : '▼'}
          </button>

          {showFilters && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
              <button onClick={() => setTypeFilter('')} style={{
                padding: '3px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '600',
                border: `1px solid ${typeFilter === '' ? '#fff' : '#2A2A2A'}`,
                backgroundColor: typeFilter === '' ? '#fff' : 'transparent',
                color: typeFilter === '' ? '#000' : '#737373',
              }}>All</button>
              {ALL_TYPES.map(t => (
                <button key={t} onClick={() => setTypeFilter(t === typeFilter ? '' : t)} style={{
                  padding: '3px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '600',
                  border: `1px solid ${typeFilter === t ? typeMeta(t).color : '#2A2A2A'}`,
                  backgroundColor: typeFilter === t ? typeMeta(t).color + '22' : 'transparent',
                  color: typeFilter === t ? typeMeta(t).color : '#737373',
                }}>{typeMeta(t).label}</button>
              ))}
            </div>
          )}
        </div>

        {/* Doc list */}
        <div style={{ flex: 1, overflow: 'auto', paddingTop: '8px' }}>
          {loading && <div style={{ color: '#555', fontSize: '13px', textAlign: 'center', paddingTop: '24px' }}>Loading...</div>}
          {!loading && docs.length === 0 && (
            <div style={{ color: '#555', fontSize: '13px', textAlign: 'center', paddingTop: '32px' }}>
              {query || typeFilter ? 'No docs match your search.' : 'No documents yet.'}
            </div>
          )}
          {docs.map(doc => {
            const meta = typeMeta(doc.type)
            const isSelected = selected?.id === doc.id
            return (
              <div
                key={doc.id}
                onClick={() => openDoc(doc)}
                style={{
                  padding: '12px 8px',
                  marginBottom: '2px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? '#1E1E1E' : 'transparent',
                  borderLeft: `2px solid ${isSelected ? meta.color : 'transparent'}`,
                }}
                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = '#181818' }}
                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                  <FileText size={14} color={meta.color} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span style={{ color: 'white', fontSize: '13px', fontWeight: '600', lineHeight: '1.4' }}>{doc.title}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '22px', flexWrap: 'wrap' }}>
                  <span style={{
                    backgroundColor: meta.color + '22', color: meta.color,
                    fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px',
                  }}>{meta.label}</span>
                  <span style={{ color: '#555', fontSize: '11px' }}>{doc.project}</span>
                  <span style={{ color: '#444', fontSize: '11px', marginLeft: 'auto' }}>{timeAgo(doc.updatedAt)}</span>
                </div>
                <div style={{ color: '#555', fontSize: '11px', paddingLeft: '22px', marginTop: '4px', lineHeight: '1.4' }}>
                  {doc.description.slice(0, 90)}{doc.description.length > 90 ? '…' : ''}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right panel: doc viewer */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {!selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#555' }}>
            <FileText size={40} style={{ marginBottom: '16px', color: '#2A2A2A' }} />
            <div style={{ fontSize: '14px' }}>Select a document to read it</div>
            <div style={{ fontSize: '12px', marginTop: '6px' }}>{docs.length} documents available</div>
          </div>
        ) : (
          <>
            {/* Doc toolbar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 28px', borderBottom: '1px solid #2A2A2A', flexShrink: 0,
              backgroundColor: '#141414', position: 'sticky', top: 0, zIndex: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  backgroundColor: typeMeta(selected.type).color + '22',
                  color: typeMeta(selected.type).color,
                  fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '4px',
                }}>{typeMeta(selected.type).label}</div>
                <span style={{ color: '#555', fontSize: '12px' }}>{selected.project}</span>
                <span style={{ color: '#444', fontSize: '11px' }}>Updated {timeAgo(selected.updatedAt)}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={copyContent}
                  disabled={!selected.content}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    backgroundColor: copied ? 'rgba(76,175,80,0.15)' : '#1A1A1A',
                    border: `1px solid ${copied ? '#4CAF50' : '#2A2A2A'}`,
                    borderRadius: '6px', padding: '6px 12px',
                    color: copied ? '#4CAF50' : '#737373', fontSize: '12px', cursor: 'pointer', fontWeight: '600',
                  }}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Doc content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '28px' }}>
              <h2 style={{ color: 'white', fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>{selected.title}</h2>
              <p style={{ color: '#737373', fontSize: '13px', marginBottom: '8px' }}>{selected.description}</p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {selected.tags?.map(tag => (
                  <span key={tag} style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: '#555', fontSize: '11px', padding: '2px 8px', borderRadius: '4px' }}>
                    #{tag}
                  </span>
                ))}
              </div>
              <div style={{ borderTop: '1px solid #2A2A2A', paddingTop: '24px' }}>
                {contentLoading ? (
                  <div style={{ color: '#555', fontSize: '13px' }}>Loading content...</div>
                ) : selected.content ? (
                  <div
                    style={{ color: '#aaa', fontSize: '13px', lineHeight: '1.8', maxWidth: '780px' }}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(selected.content) }}
                  />
                ) : (
                  <div style={{ color: '#555', fontSize: '13px' }}>Content not available (file may have moved).</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
