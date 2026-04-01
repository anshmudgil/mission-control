'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface OutreachState {
  sent: Record<string, { name: string; title: string; sent_at: string }>
  failed: Record<string, unknown>
  skipped: Record<string, unknown>
  daily_counts: Record<string, number>
}

interface NurtureLead {
  id?: string
  name?: string
  email?: string
  income?: string
  status?: string
  enrolled_at?: string
  emails_sent?: number[]
}

interface NurtureState {
  leads?: NurtureLead[]
}


interface ScheduledTask {
  nextRun: string | null
  lastRun: string | null
  status: string | null
  found: boolean
}

interface MarketingData {
  outreach: OutreachState
  nurture: NurtureState
  scheduledTask: ScheduledTask
  ollama: { ollamaOnline: boolean; model: string }
}

const TOTAL_PROSPECTS = 464

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      backgroundColor: '#1A1A1A',
      border: '1px solid #2A2A2A',
      borderRadius: 8,
      padding: 20,
      ...style,
    }}>
      {children}
    </div>
  )
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ color: '#737373', fontSize: 12, margin: '4px 0 0' }}>{subtitle}</p>}
    </div>
  )
}

function StatCard({ label, value, color = 'white', sub }: { label: string; value: string | number; color?: string; sub?: string }) {
  return (
    <div style={{ backgroundColor: '#111', border: '1px solid #2A2A2A', borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 100 }}>
      <div style={{ color, fontSize: 24, fontWeight: 800, lineHeight: 1 }}>{value}</div>
      <div style={{ color: '#737373', fontSize: 11, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ color: '#404040', fontSize: 10, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      backgroundColor: color + '22',
      color,
      fontSize: 10,
      fontWeight: 700,
      padding: '2px 8px',
      borderRadius: 6,
      border: `1px solid ${color}44`,
    }}>
      {label}
    </span>
  )
}

function StatusDot({ online }: { online: boolean }) {
  return (
    <span style={{
      display: 'inline-block',
      width: 8,
      height: 8,
      borderRadius: '50%',
      backgroundColor: online ? '#22c55e' : '#ef4444',
      marginRight: 6,
      flexShrink: 0,
    }} />
  )
}

function maskEmail(email: string) {
  const at = email.indexOf('@')
  if (at < 0) return email
  return email.slice(0, Math.min(3, at)) + '***' + email.slice(at)
}

// ─── Section A: Outreach Pipeline ────────────────────────────────────────────
function OutreachSection({ outreach, scheduledTask }: { outreach: OutreachState; scheduledTask: ScheduledTask }) {
  const sentCount     = Object.keys(outreach.sent || {}).length
  const failedCount   = Object.keys(outreach.failed || {}).length
  const remaining     = TOTAL_PROSPECTS - sentCount
  const pct           = Math.round((sentCount / TOTAL_PROSPECTS) * 100)
  const dailyCounts   = outreach.daily_counts || {}

  // Last 7 days
  const today = new Date()
  const last7: { date: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    last7.push({ date: key, count: dailyCounts[key] || 0 })
  }
  const maxCount = Math.max(...last7.map(d => d.count), 1)

  const isComplete = remaining <= 0
  const statusText = isComplete
    ? 'Complete — all prospects contacted'
    : scheduledTask.nextRun
      ? `Running — next batch: ${scheduledTask.nextRun}`
      : 'Running — next batch tomorrow 9:00 AM'

  return (
    <Card>
      <SectionHeader title="📧 Outreach Pipeline" subtitle="Cold email to 464 medical/healthcare professionals" />

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <StatCard label="Total Prospects" value={TOTAL_PROSPECTS} />
        <StatCard label="Sent" value={sentCount} color="#C9A84C" />
        <StatCard label="Remaining" value={remaining} color="#737373" />
        <StatCard label="Failed" value={failedCount} color={failedCount > 0 ? '#ef4444' : '#737373'} />
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: '#737373', fontSize: 12 }}>Progress</span>
          <span style={{ color: '#C9A84C', fontSize: 12, fontWeight: 700 }}>{pct}%</span>
        </div>
        <div style={{ height: 8, backgroundColor: '#111', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            backgroundColor: '#C9A84C',
            borderRadius: 4,
            transition: 'width 0.6s ease',
          }} />
        </div>
        <div style={{ color: '#404040', fontSize: 11, marginTop: 4 }}>{sentCount} of {TOTAL_PROSPECTS} sent</div>
      </div>

      {/* Daily bar chart */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: '#737373', fontSize: 12, marginBottom: 8 }}>Daily sends — last 7 days</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 56 }}>
          {last7.map(({ date, count }) => {
            const h = count > 0 ? Math.max(8, Math.round((count / maxCount) * 48)) : 4
            const isToday = date === today.toISOString().slice(0, 10)
            return (
              <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                <div style={{ color: '#737373', fontSize: 9 }}>{count || ''}</div>
                <div style={{
                  width: '100%',
                  height: h,
                  backgroundColor: isToday ? '#C9A84C' : (count > 0 ? '#C9A84C66' : '#2A2A2A'),
                  borderRadius: 2,
                  transition: 'height 0.4s ease',
                }} />
                <div style={{ color: '#404040', fontSize: 9, whiteSpace: 'nowrap' }}>
                  {date.slice(5)} {/* MM-DD */}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', backgroundColor: '#111', borderRadius: 6, border: '1px solid #2A2A2A' }}>
        <StatusDot online={!isComplete} />
        <span style={{ color: isComplete ? '#22c55e' : '#C9A84C', fontSize: 12, fontWeight: 600 }}>{statusText}</span>
      </div>

      {scheduledTask.lastRun && (
        <div style={{ color: '#404040', fontSize: 11, marginTop: 8 }}>Last run: {scheduledTask.lastRun}</div>
      )}
    </Card>
  )
}

// ─── Section B: Waitlist Nurture ──────────────────────────────────────────────
function NurtureSection({ nurture }: { nurture: NurtureState }) {
  const leads = nurture.leads || []
  const total     = leads.length
  const active    = leads.filter(l => l.status === 'active').length
  const completed = leads.filter(l => l.status === 'completed').length

  const EMAIL_COLORS: Record<number, string> = { 1: '#C9A84C', 2: '#4A90D9', 3: '#22c55e' }

  return (
    <Card>
      <SectionHeader title="🌱 Waitlist Nurture Pipeline" subtitle="3-email urgency sequence for waitlist leads" />

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <StatCard label="Total Enrolled" value={total} />
        <StatCard label="Active" value={active} color="#22c55e" />
        <StatCard label="Completed" value={completed} color="#4A90D9" />
      </div>

      {leads.length === 0 ? (
        <div style={{ color: '#404040', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
          No leads enrolled yet. Nurture agent will auto-enrol from Monday board.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
                {['Name', 'Email', 'Income', 'Emails Sent', 'Status', 'Enrolled'].map(h => (
                  <th key={h} style={{ color: '#404040', fontSize: 10, fontWeight: 700, textAlign: 'left', padding: '6px 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => {
                const emailsSent = lead.emails_sent || []
                const statusColor = lead.status === 'active' ? '#22c55e' : lead.status === 'completed' ? '#4A90D9' : '#737373'
                return (
                  <tr key={lead.id || i} style={{ borderBottom: '1px solid #1A1A1A' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#1E1E1E' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent' }}>
                    <td style={{ padding: '9px 10px', color: 'white', fontWeight: 600 }}>{lead.name || '—'}</td>
                    <td style={{ padding: '9px 10px', color: '#737373', fontFamily: 'monospace', fontSize: 11 }}>{lead.email ? maskEmail(lead.email) : '—'}</td>
                    <td style={{ padding: '9px 10px', color: '#737373' }}>{lead.income || '—'}</td>
                    <td style={{ padding: '9px 10px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[1, 2, 3].map(n => (
                          <span key={n} style={{
                            width: 20, height: 20, borderRadius: 4, fontSize: 10, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: emailsSent.includes(n) ? EMAIL_COLORS[n] + '33' : '#111',
                            color: emailsSent.includes(n) ? EMAIL_COLORS[n] : '#404040',
                            border: `1px solid ${emailsSent.includes(n) ? EMAIL_COLORS[n] + '55' : '#2A2A2A'}`,
                          }}>{n}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '9px 10px' }}>
                      <span style={{ color: statusColor, fontSize: 11, fontWeight: 600 }}>● {lead.status || 'unknown'}</span>
                    </td>
                    <td style={{ padding: '9px 10px', color: '#404040', fontSize: 11 }}>
                      {lead.enrolled_at ? new Date(lead.enrolled_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
        {[
          { n: 1, label: 'Email 1 (Immediate)', color: '#C9A84C' },
          { n: 2, label: 'Email 2 (Day 3)', color: '#4A90D9' },
          { n: 3, label: 'Email 3 (Day 7)', color: '#22c55e' },
        ].map(({ n, label, color }) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 16, height: 16, borderRadius: 3, backgroundColor: color + '33', color, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}55` }}>{n}</span>
            <span style={{ color: '#404040', fontSize: 11 }}>{label}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── Section C: Stock List ────────────────────────────────────────────────────
function StockSection({ stockList, stockMtime }: { stockList: any[]; stockMtime: string | null }) {
  const typeColors: Record<string, string> = {
    'Off-market': '#C9A84C',
    'Listed': '#4A90D9',
    'Under Contract': '#A855F7',
    'Sold': '#737373',
  }

  const statusColors: Record<string, string> = {
    'Available': '#22c55e',
    'Under Contract': '#C9A84C',
    'Sold': '#ef4444',
  }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <SectionHeader title="🏠 Stock List" subtitle={`${stockList.length} properties available`} />
        {stockMtime && (
          <div style={{ color: '#404040', fontSize: 11, textAlign: 'right', flexShrink: 0 }}>
            <div>Last updated</div>
            <div style={{ color: '#737373' }}>{new Date(stockMtime).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        )}
      </div>

      {stockList.length === 0 ? (
        <div style={{ color: '#404040', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>No stock loaded yet.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {stockList.map((item, i) => {
            const tc = typeColors[item.type] || '#737373'
            const sc = statusColors[item.status] || '#737373'
            return (
              <div key={i} style={{
                backgroundColor: '#111',
                border: '1px solid #2A2A2A',
                borderRadius: 8,
                padding: 16,
                borderTop: `2px solid ${tc}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 8 }}>
                  <div style={{ color: 'white', fontSize: 13, fontWeight: 700, lineHeight: 1.3, flex: 1 }}>{item.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: sc }} />
                    <span style={{ color: sc, fontSize: 10, fontWeight: 700 }}>{item.status}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                  <span style={{ color: '#C9A84C', fontSize: 18, fontWeight: 800 }}>{item.price}</span>
                  <span style={{ color: '#22c55e', fontSize: 12, fontWeight: 700 }}>{item.yield} yield</span>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <Badge label={item.type} color={tc} />
                </div>

                <div style={{ color: '#737373', fontSize: 11, lineHeight: 1.5 }}>{item.highlight}</div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

// ─── Section D: Email Performance ─────────────────────────────────────────────
function EmailPerformanceSection() {
  const metrics = [
    { label: 'Sent Today', value: '—', color: '#C9A84C', sub: 'Via outreach worker' },
    { label: 'Open Rate', value: '—', color: '#737373', sub: 'Not wired yet' },
    { label: 'Replies', value: '—', color: '#737373', sub: 'Not wired yet' },
    { label: 'Waitlist Signups', value: '—', color: '#737373', sub: 'Not wired yet' },
  ]

  return (
    <Card>
      <SectionHeader title="📊 Email Performance" subtitle="Live metrics — coming soon" />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {metrics.map(m => (
          <StatCard key={m.label} label={m.label} value={m.value} color={m.color} sub={m.sub} />
        ))}
      </div>
      <div style={{ color: '#404040', fontSize: 11, marginTop: 14, padding: '10px 14px', backgroundColor: '#111', borderRadius: 6, border: '1px solid #2A2A2A' }}>
        📌 Will be wired to SendGrid / SMTP tracking when outreach volume increases.
      </div>
    </Card>
  )
}

// ─── Section E: Agents Running ────────────────────────────────────────────────
function AgentsSection({
  scheduledTask,
  nurtureLeads,
  ollama,
}: {
  scheduledTask: ScheduledTask
  nurtureLeads: number
  ollama: { ollamaOnline: boolean; model: string }
}) {
  const agents = [
    {
      name: 'Outreach Worker',
      emoji: '📧',
      color: '#C9A84C',
      type: 'Task Scheduler — 9:00 AM daily',
      statusLabel: scheduledTask.found ? scheduledTask.status || 'Scheduled' : 'Scheduled',
      online: true,
      details: [
        { k: 'Next Run', v: scheduledTask.nextRun || 'Tomorrow 9:00 AM' },
        { k: 'Last Run', v: scheduledTask.lastRun || 'Today (completed)' },
        { k: 'Batch Size', v: '30 emails/day' },
      ],
    },
    {
      name: 'Waitlist Nurture',
      emoji: '🌱',
      color: '#22c55e',
      type: 'Background service — polls every 15 min',
      statusLabel: 'Running',
      online: true,
      details: [
        { k: 'Leads in Pipeline', v: String(nurtureLeads) },
        { k: 'Sequence', v: '3-email urgency flow' },
        { k: 'Board', v: 'Monday ID 5027525374' },
      ],
    },
    {
      name: 'Ollama (Local AI)',
      emoji: '🤖',
      color: '#A855F7',
      type: 'Always-on — RTX 4070 SUPER',
      statusLabel: ollama.ollamaOnline ? 'Online' : 'Offline',
      online: ollama.ollamaOnline,
      details: [
        { k: 'Model', v: ollama.model },
        { k: 'Port', v: 'localhost:11434' },
        { k: 'Hardware', v: 'RTX 4070 SUPER (GPU)' },
      ],
    },
  ]

  return (
    <Card>
      <SectionHeader title="🤖 Agents Running" subtitle="Live status of all VW automation agents" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {agents.map(agent => (
          <div key={agent.name} style={{
            backgroundColor: '#111',
            border: `1px solid ${agent.online ? agent.color + '44' : '#2A2A2A'}`,
            borderTop: `2px solid ${agent.online ? agent.color : '#2A2A2A'}`,
            borderRadius: 8,
            padding: 16,
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                backgroundColor: agent.color + '22',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>{agent.emoji}</div>
              <div>
                <div style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>{agent.name}</div>
                <div style={{ color: '#404040', fontSize: 10, marginTop: 1 }}>{agent.type}</div>
              </div>
            </div>

            {/* Status badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <StatusDot online={agent.online} />
              <span style={{ color: agent.online ? '#22c55e' : '#ef4444', fontSize: 11, fontWeight: 700 }}>{agent.statusLabel}</span>
            </div>

            {/* Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {agent.details.map(({ k, v }) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ color: '#404040', fontSize: 11 }}>{k}</span>
                  <span style={{ color: '#737373', fontSize: 11, textAlign: 'right', fontFamily: 'monospace' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MarketingPage() {
  const [data, setData] = useState<MarketingData | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/marketing')
      if (res.ok) {
        const json = await res.json() as MarketingData
        setData(json)
        setLastUpdated(new Date())
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const iv = setInterval(loadData, 30000)
    return () => clearInterval(iv)
  }, [loadData])

  const sentCount = Object.keys(data?.outreach?.sent || {}).length

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ color: 'white', fontSize: 22, fontWeight: 800, margin: 0 }}>
            🏛️ Vermilion Wealth — Marketing Command Centre
          </h1>
          <p style={{ color: '#737373', fontSize: 13, margin: '6px 0 0' }}>
            Live monitoring of all outreach, nurture, and marketing automation
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          {lastUpdated && (
            <div style={{ color: '#404040', fontSize: 11 }}>
              Updated {lastUpdated.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end', marginTop: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#22c55e', animation: 'pulse 2s infinite' }} />
            <span style={{ color: '#22c55e', fontSize: 11 }}>Live — refreshes every 30s</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ color: '#404040', fontSize: 14, textAlign: 'center', padding: '60px 0' }}>
          Loading marketing data...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* A. Outreach */}
          <OutreachSection
            outreach={data?.outreach || { sent: {}, failed: {}, skipped: {}, daily_counts: {} }}
            scheduledTask={data?.scheduledTask || { nextRun: null, lastRun: null, status: null, found: false }}
          />

          {/* B. Nurture */}
          <NurtureSection nurture={data?.nurture || { leads: [] }} />

          {/* D. Email Performance */}
          <EmailPerformanceSection />

          {/* E. Agents */}
          <AgentsSection
            scheduledTask={data?.scheduledTask || { nextRun: null, lastRun: null, status: null, found: false }}
            nurtureLeads={(data?.nurture?.leads || []).length}
            ollama={data?.ollama || { ollamaOnline: false, model: 'qwen3.5:9b' }}
          />
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
