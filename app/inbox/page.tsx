'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, ExternalLink, ArrowRight, Mail, Circle, CheckCircle2 } from 'lucide-react'

interface Email {
  id: string
  sender: string
  senderEmail: string
  subject: string
  snippet: string
  summary: string
  category: string
  priority: 'high' | 'medium' | 'low'
  unread: boolean
  ts: string
  projectId?: string
  usedOllama: boolean
}

interface Project {
  id: string
  name: string
  stage: string
  color: string
  contact: string
  nextAction: string
}

const CAT_COLOR: Record<string, string> = {
  BD:            '#C9A84C',
  Legal:         '#E53935',
  VPA:           '#4A90D9',
  Uni:           '#A855F7',
  Admin:         '#888',
  FYI:           '#AAA',
  uncategorised: '#CCC',
}

const PRI_COLOR: Record<string, string> = {
  high:   '#E53935',
  medium: '#F59E0B',
  low:    '#CCC',
}

const ALL_CATS = ['All', 'BD', 'Legal', 'Uni', 'VPA']

function timeLabel(ts: string) {
  const d = new Date(ts)
  const now = new Date()
  const diffH = (now.getTime() - d.getTime()) / 3600000
  if (diffH < 1)  return `${Math.round(diffH * 60)}m ago`
  if (diffH < 24) return d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function InboxPage() {
  const [emails, setEmails]         = useState<Email[]>([])
  const [projects, setProjects]     = useState<Project[]>([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter]         = useState('All')
  const [selected, setSelected]     = useState<Email | null>(null)
  const [done, setDone]             = useState<Set<string>>(new Set())
  const [lastFetch, setLastFetch]   = useState<Date | null>(null)

  const load = useCallback(async (force = false) => {
    force ? setRefreshing(true) : setLoading(true)
    try {
      const [eRes, pRes] = await Promise.all([
        fetch('/api/inbox', { method: force ? 'POST' : 'GET' }),
        fetch('/api/projects'),
      ])
      setEmails(Array.isArray(await eRes.json()) ? await fetch('/api/inbox').then(r => r.json()) : [])
      setProjects(Array.isArray(await pRes.json()) ? await fetch('/api/projects').then(r => r.json()) : [])
      setLastFetch(new Date())
    } catch { setEmails([]) }
    setLoading(false)
    setRefreshing(false)
  }, [])

  // simpler version
  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const [eRes, pRes] = await Promise.all([fetch('/api/inbox'), fetch('/api/projects')])
        const e = await eRes.json(); const p = await pRes.json()
        setEmails(Array.isArray(e) ? e : [])
        setProjects(Array.isArray(p) ? p : [])
        setLastFetch(new Date())
      } catch { setEmails([]) }
      setLoading(false)
    })()
  }, [])

  const forceRefresh = async () => {
    setRefreshing(true)
    try {
      const [eRes, pRes] = await Promise.all([
        fetch('/api/inbox', { method: 'POST' }),
        fetch('/api/projects'),
      ])
      const e = await eRes.json(); const p = await pRes.json()
      setEmails(Array.isArray(e) ? e : [])
      setProjects(Array.isArray(p) ? p : [])
      setLastFetch(new Date())
    } catch { /* ignore */ }
    setRefreshing(false)
  }

  const toggleDone = (id: string) => {
    setDone(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const projectById = (id: string) => projects.find(p => p.id === id)

  const visible = (filter === 'All' ? emails : emails.filter(e => e.category === filter))
    .filter(e => !done.has(e.id))

  const doneItems = emails.filter(e => done.has(e.id))
  const unreadCount = emails.filter(e => e.unread && !done.has(e.id)).length

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden', backgroundColor: '#FAFAFA' }}>

      {/* ── Left list ─────────────────────────────────────────────────────── */}
      <div style={{ width: '440px', flexShrink: 0, borderRight: '1px solid #EBEBEB', display: 'flex', flexDirection: 'column', backgroundColor: '#FFF' }}>

        {/* Header */}
        <div style={{ padding: '20px 22px 14px', borderBottom: '1px solid #F0F0F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#111', fontSize: '15px', fontWeight: '700', letterSpacing: '-0.02em' }}>
                Action Required
              </span>
              {unreadCount > 0 && (
                <span style={{ backgroundColor: '#111', color: '#FFF', fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '20px' }}>
                  {unreadCount}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {lastFetch && <span style={{ color: '#CCC', fontSize: '10px' }}>{lastFetch.toLocaleTimeString()}</span>}
              <button
                onClick={forceRefresh} disabled={refreshing}
                style={{ background: 'none', border: '1px solid #E8E8E8', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: '#888' }}
              >
                <RefreshCw size={10} color="#888" style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                <span style={{ fontSize: '11px', color: '#888' }}>{refreshing ? 'Syncing...' : 'Sync'}</span>
              </button>
            </div>
          </div>

          {/* Category tabs */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {ALL_CATS.map(cat => {
              const active = filter === cat
              const col = CAT_COLOR[cat] ?? '#888'
              return (
                <button key={cat} onClick={() => setFilter(cat)} style={{
                  padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                  cursor: 'pointer', border: active ? `1.5px solid ${col}` : '1.5px solid #EEE',
                  backgroundColor: active ? col + '12' : 'transparent',
                  color: active ? col : '#AAA',
                  transition: 'all 0.12s',
                }}>
                  {cat}
                </button>
              )
            })}
          </div>
        </div>

        {/* Email list */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#CCC', fontSize: '13px' }}>Loading...</div>
          ) : visible.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <CheckCircle2 size={28} color="#DDD" style={{ marginBottom: '8px' }} />
              <div style={{ color: '#CCC', fontSize: '13px' }}>All clear</div>
            </div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              {visible.map(email => (
                <EmailRow
                  key={email.id}
                  email={email}
                  selected={selected?.id === email.id}
                  onClick={() => setSelected(email)}
                  onDone={() => toggleDone(email.id)}
                  project={email.projectId ? projectById(email.projectId) : undefined}
                />
              ))}
            </div>
          )}

          {/* Done section */}
          {doneItems.length > 0 && (
            <div style={{ borderTop: '1px solid #F5F5F5', padding: '12px 22px 8px' }}>
              <div style={{ color: '#CCC', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                Done ({doneItems.length})
              </div>
              {doneItems.map(email => (
                <div
                  key={email.id}
                  onClick={() => toggleDone(email.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', cursor: 'pointer', opacity: 0.45 }}
                >
                  <CheckCircle2 size={14} color="#AAA" />
                  <span style={{ color: '#AAA', fontSize: '12px', textDecoration: 'line-through', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {email.sender} — {email.subject}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right detail ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#FAFAFA' }}>
        {selected ? (
          <EmailDetail
            email={selected}
            project={selected.projectId ? projectById(selected.projectId) : undefined}
            isDone={done.has(selected.id)}
            onDone={() => toggleDone(selected.id)}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '10px' }}>
            <Mail size={32} color="#DDD" />
            <span style={{ color: '#CCC', fontSize: '13px' }}>Select an item</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Email row ──────────────────────────────────────────────────────────────
function EmailRow({ email, selected, onClick, onDone, project }: {
  email: Email; selected: boolean; onClick: () => void; onDone: () => void; project?: Project
}) {
  const catColor = CAT_COLOR[email.category] ?? '#888'
  const priColor = PRI_COLOR[email.priority] ?? '#CCC'

  return (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '12px',
        padding: '12px 22px',
        backgroundColor: selected ? '#F7F7F7' : 'transparent',
        borderLeft: `3px solid ${selected ? catColor : 'transparent'}`,
        cursor: 'pointer', transition: 'background-color 0.1s',
      }}
      onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLElement).style.backgroundColor = '#FAFAFA' }}
      onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
    >
      {/* Checkbox */}
      <button
        onClick={e => { e.stopPropagation(); onDone() }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', flexShrink: 0, marginTop: '1px' }}
      >
        <Circle size={16} color="#DDD" />
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }} onClick={onClick}>
        {/* Sender + time */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span style={{ color: '#111', fontSize: '13px', fontWeight: email.unread ? '700' : '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {email.sender}
          </span>
          <span style={{ color: '#CCC', fontSize: '10px', flexShrink: 0, marginLeft: '8px' }}>{timeLabel(email.ts)}</span>
        </div>

        {/* Subject */}
        <div style={{ color: '#444', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '5px' }}>
          {email.subject}
        </div>

        {/* Tags row */}
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{
            backgroundColor: catColor + '15', color: catColor,
            fontSize: '9px', fontWeight: '800', padding: '2px 8px',
            borderRadius: '20px', letterSpacing: '0.06em',
          }}>
            {email.category}
          </span>
          {email.priority === 'high' && (
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: priColor, display: 'inline-block', flexShrink: 0 }} />
          )}
          {project && (
            <span style={{ color: project.color, fontSize: '10px', fontWeight: '600' }}>
              · {project.name}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Email detail ───────────────────────────────────────────────────────────
function EmailDetail({ email, project, isDone, onDone }: {
  email: Email; project?: Project; isDone: boolean; onDone: () => void
}) {
  const catColor = CAT_COLOR[email.category] ?? '#888'
  const priColor = PRI_COLOR[email.priority] ?? '#CCC'

  return (
    <div style={{ padding: '36px 40px', maxWidth: '680px' }}>

      {/* Badges + action */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <span style={{ backgroundColor: catColor + '15', color: catColor, fontSize: '10px', fontWeight: '800', padding: '3px 12px', borderRadius: '20px', letterSpacing: '0.06em' }}>
          {email.category}
        </span>
        {email.priority !== 'low' && (
          <span style={{ backgroundColor: priColor + '15', color: priColor, fontSize: '10px', fontWeight: '700', padding: '3px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: priColor, display: 'inline-block' }} />
            {email.priority} priority
          </span>
        )}
        {email.unread && (
          <span style={{ backgroundColor: '#11111108', color: '#888', fontSize: '10px', fontWeight: '600', padding: '3px 12px', borderRadius: '20px', border: '1px solid #EEE' }}>
            unread
          </span>
        )}
        <button
          onClick={onDone}
          style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
            border: isDone ? '1px solid #E8E8E8' : '1px solid #111',
            backgroundColor: isDone ? 'transparent' : '#111',
            color: isDone ? '#AAA' : '#FFF',
          }}
        >
          {isDone ? '↩ Restore' : '✓ Mark done'}
        </button>
      </div>

      {/* Subject */}
      <h2 style={{ color: '#111', fontSize: '20px', fontWeight: '700', margin: '0 0 14px', lineHeight: 1.3, letterSpacing: '-0.02em' }}>
        {email.subject}
      </h2>

      {/* Sender row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
          backgroundColor: catColor + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: catColor, fontSize: '12px', fontWeight: '800',
        }}>
          {initials(email.sender)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#222', fontSize: '14px', fontWeight: '600' }}>{email.sender}</div>
          <div style={{ color: '#AAA', fontSize: '11px', marginTop: '2px' }}>
            {email.senderEmail} · {new Date(email.ts).toLocaleString('en-AU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <a
          href={`https://mail.google.com/mail/u/0/#inbox/${email.id}`}
          target="_blank" rel="noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#888', fontSize: '11px', textDecoration: 'none', padding: '6px 12px', border: '1px solid #E8E8E8', borderRadius: '6px' }}
        >
          <ExternalLink size={11} />
          Open in Gmail
        </a>
      </div>

      {/* Project link */}
      {project && (
        <div style={{
          border: `1px solid ${project.color}30`,
          borderLeft: `3px solid ${project.color}`,
          borderRadius: '8px', padding: '14px 18px', marginBottom: '20px',
          backgroundColor: project.color + '06',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ color: project.color, fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Linked Project</div>
            <div style={{ color: '#222', fontSize: '14px', fontWeight: '700' }}>{project.name}</div>
            <div style={{ color: '#888', fontSize: '11px', marginTop: '3px' }}>{project.stage} · {project.nextAction}</div>
          </div>
          <a href="/projects" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: project.color, fontSize: '11px', textDecoration: 'none', fontWeight: '600', flexShrink: 0 }}>
            View <ArrowRight size={12} />
          </a>
        </div>
      )}

      {/* Summary card */}
      <div style={{ backgroundColor: '#FFF', border: '1px solid #EBEBEB', borderRadius: '10px', padding: '18px 22px' }}>
        <div style={{ color: '#CCC', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
          {email.summary ? '✦ Summary' : 'Preview'}
        </div>
        <p style={{ color: '#444', fontSize: '14px', lineHeight: '1.7', margin: 0 }}>
          {email.summary || email.snippet}
        </p>
      </div>
    </div>
  )
}


