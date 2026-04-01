'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Zap, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react'

interface CronJob {
  id: string
  name: string
  agent: string
  description: string
  schedule: {
    kind: string
    expr: string
    tz: string
    humanReadable: string
  }
  color: string
  icon: string
  enabled: boolean
  lastRunAt: string | null
  lastRunStatus: string | null
  lastRunDurationMs: number | null
  nextRunAt: string | null
  createdAt: string
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function jobRunsOnDay(job: CronJob, date: Date): boolean {
  const expr = job.schedule.expr
  const parts = expr.split(' ')
  if (parts.length < 5) return false
  const dowPart = parts[4]
  const domPart = parts[2]
  const dayOfWeek = date.getDay() // 0=Sun
  const dayOfMonth = date.getDate()

  // Check day of week
  if (dowPart !== '*') {
    const allowed = dowPart.split(',').map(Number)
    if (!allowed.includes(dayOfWeek)) return false
  }

  // Check day of month range (e.g. 1-7)
  if (domPart !== '*') {
    if (domPart.includes('-')) {
      const [min, max] = domPart.split('-').map(Number)
      if (dayOfMonth < min || dayOfMonth > max) return false
    } else {
      const allowed = domPart.split(',').map(Number)
      if (!allowed.includes(dayOfMonth)) return false
    }
  }

  return true
}

function getWeekDates(anchor: Date): Date[] {
  const start = new Date(anchor)
  start.setDate(start.getDate() - start.getDay()) // go to Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

export default function CalendarPage() {
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [anchor, setAnchor] = useState(new Date())
  const [selectedJob, setSelectedJob] = useState<CronJob | null>(null)

  useEffect(() => {
    fetch('/api/cron-jobs').then(r => r.json()).then(setJobs)
  }, [])

  const weekDates = getWeekDates(anchor)
  const today = new Date()

  const prevWeek = () => { const d = new Date(anchor); d.setDate(d.getDate() - 7); setAnchor(d) }
  const nextWeek = () => { const d = new Date(anchor); d.setDate(d.getDate() + 7); setAnchor(d) }
  const goToday = () => setAnchor(new Date())

  const weekLabel = `${weekDates[0].toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })} – ${weekDates[6].toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })}`

  return (
    <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 64px)' }}>

      {/* Left: Calendar */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Header */}
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>Calendar</h1>
          <p style={{ color: '#737373', fontSize: '14px' }}>All scheduled jobs and tasks — verified from live cron data.</p>
        </div>

        {/* Week Navigator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={prevWeek} style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '6px', padding: '6px 10px', color: 'white', cursor: 'pointer' }}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ color: 'white', fontSize: '14px', fontWeight: '600', minWidth: '200px', textAlign: 'center' }}>{weekLabel}</span>
          <button onClick={nextWeek} style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '6px', padding: '6px 10px', color: 'white', cursor: 'pointer' }}>
            <ChevronRight size={16} />
          </button>
          <button onClick={goToday} style={{ background: 'transparent', border: '1px solid #2A2A2A', borderRadius: '6px', padding: '6px 14px', color: '#737373', cursor: 'pointer', fontSize: '13px' }}>
            Today
          </button>
        </div>

        {/* 7-column day grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
          {weekDates.map((date, idx) => {
            const isToday = isSameDay(date, today)
            const dayJobs = jobs.filter(j => jobRunsOnDay(j, date))
            return (
              <div key={idx} style={{
                backgroundColor: isToday ? '#1E1E1E' : '#181818',
                border: `1px solid ${isToday ? '#3A3A3A' : '#222'}`,
                borderRadius: '8px',
                padding: '10px 8px',
                minHeight: '120px',
              }}>
                <div style={{ marginBottom: '8px', textAlign: 'center' }}>
                  <div style={{ color: '#555', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{DAY_NAMES[date.getDay()]}</div>
                  <div style={{
                    fontSize: '18px', fontWeight: '700',
                    color: isToday ? '#C9A84C' : 'white',
                    lineHeight: '1.2'
                  }}>{date.getDate()}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {dayJobs.map(job => (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      style={{
                        backgroundColor: job.color + '22',
                        borderLeft: `2px solid ${job.color}`,
                        borderRadius: '3px',
                        padding: '3px 5px',
                        fontSize: '10px',
                        color: job.color,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontWeight: '600',
                      }}
                    >
                      {job.name}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Scheduled Jobs List */}
        <div>
          <h2 style={{ color: '#737373', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>All Scheduled Jobs</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {jobs.map(job => (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                style={{
                  backgroundColor: selectedJob?.id === job.id ? '#1E1E1E' : '#181818',
                  border: `1px solid ${selectedJob?.id === job.id ? job.color + '66' : '#2A2A2A'}`,
                  borderLeft: `3px solid ${job.color}`,
                  borderRadius: '6px',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '2px' }}>{job.name}</div>
                  <div style={{ color: '#737373', fontSize: '12px' }}>{job.schedule.humanReadable}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {job.lastRunAt ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: job.lastRunStatus === 'ok' ? '#4CAF50' : '#ef4444', fontSize: '12px' }}>
                      {job.lastRunStatus === 'ok' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                      {timeAgo(job.lastRunAt)}
                    </div>
                  ) : (
                    <div style={{ color: '#555', fontSize: '12px' }}>Never run</div>
                  )}
                  <div style={{ color: '#555', fontSize: '11px', marginTop: '2px' }}>
                    Next: {job.nextRunAt ? new Date(job.nextRunAt).toLocaleString('en-AU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Detail Panel */}
      <div style={{
        width: '300px',
        flexShrink: 0,
        backgroundColor: '#181818',
        border: '1px solid #2A2A2A',
        borderRadius: '8px',
        padding: '20px',
        height: 'fit-content',
        position: 'sticky',
        top: 0,
      }}>
        {!selectedJob ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#555' }}>
            <Calendar size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontSize: '13px' }}>Select a job to see details</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: selectedJob.color, flexShrink: 0 }} />
                <span style={{ color: 'white', fontSize: '16px', fontWeight: '700' }}>{selectedJob.name}</span>
              </div>
              <div style={{
                display: 'inline-block',
                backgroundColor: selectedJob.enabled ? 'rgba(76,175,80,0.15)' : 'rgba(255,68,68,0.15)',
                color: selectedJob.enabled ? '#4CAF50' : '#ff4444',
                fontSize: '11px', fontWeight: '600',
                padding: '2px 8px', borderRadius: '4px',
              }}>
                {selectedJob.enabled ? '● ENABLED' : '● DISABLED'}
              </div>
            </div>

            <div style={{ color: '#aaa', fontSize: '13px', lineHeight: '1.6' }}>{selectedJob.description}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Row label="Agent" value={selectedJob.agent} icon={<Zap size={12} color="#C9A84C" />} />
              <Row label="Schedule" value={selectedJob.schedule.humanReadable} icon={<Clock size={12} color="#737373" />} />
              <Row label="Last run" value={formatDate(selectedJob.lastRunAt)} />
              <Row label="Last status" value={
                selectedJob.lastRunStatus === 'ok' ? '✓ OK' :
                selectedJob.lastRunStatus === null ? '—' : '✗ Error'
              } valueColor={
                selectedJob.lastRunStatus === 'ok' ? '#4CAF50' :
                selectedJob.lastRunStatus === null ? '#555' : '#ef4444'
              } />
              <Row label="Duration" value={selectedJob.lastRunDurationMs ? `${(selectedJob.lastRunDurationMs / 1000).toFixed(1)}s` : '—'} />
              <Row label="Next run" value={formatDate(selectedJob.nextRunAt)} />
              <Row label="Created" value={formatDate(selectedJob.createdAt)} />
            </div>

            <div>
              <div style={{ color: '#555', fontSize: '11px', marginBottom: '6px' }}>CRON EXPRESSION</div>
              <code style={{
                display: 'block',
                backgroundColor: '#111',
                border: '1px solid #2A2A2A',
                borderRadius: '4px',
                padding: '8px 10px',
                color: '#C9A84C',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}>{selectedJob.schedule.expr}</code>
              <div style={{ color: '#555', fontSize: '11px', marginTop: '4px' }}>TZ: {selectedJob.schedule.tz}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, icon, valueColor }: { label: string; value: string; icon?: React.ReactNode; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#555', fontSize: '12px', flexShrink: 0 }}>
        {icon}{label}
      </div>
      <div style={{ color: valueColor || '#aaa', fontSize: '12px', textAlign: 'right', wordBreak: 'break-word' }}>{value}</div>
    </div>
  )
}
