'use client'
import { useState, useEffect } from 'react'
import { Zap, User, Activity } from 'lucide-react'

interface ActivityEntry {
  ts: string
  actor: string
  action: string
  taskId?: string
  taskTitle?: string
  from?: string
  to?: string
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function actionLabel(entry: ActivityEntry) {
  if (entry.action === 'created') return `created "${entry.taskTitle}"`
  if (entry.action === 'picked_up') return `picked up "${entry.taskTitle}"`
  if (entry.action === 'completed') return `completed "${entry.taskTitle}"`
  if (entry.action === 'moved') return `moved "${entry.taskTitle}" → ${entry.to}`
  return `${entry.action} "${entry.taskTitle}"`
}

export default function ActivityFeed() {
  const [entries, setEntries] = useState<ActivityEntry[]>([])

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/activity')
      const data = await res.json()
      setEntries(data)
    }
    load()
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      backgroundColor: '#1A1A1A',
      border: '1px solid #2A2A2A',
      borderRadius: '8px',
      padding: '16px',
      height: '100%',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Activity size={14} color="#C9A84C" />
        <span style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>Live Activity</span>
        <span style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4CAF50', display: 'inline-block' }} title="live" />
      </div>
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {entries.length === 0 && (
          <p style={{ color: '#555', fontSize: '12px', textAlign: 'center', marginTop: '24px' }}>No activity yet.</p>
        )}
        {entries.map((entry, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <div style={{ marginTop: '2px', flexShrink: 0 }}>
              {entry.actor === 'jarvis'
                ? <Zap size={12} color="#C9A84C" />
                : <User size={12} color="#4A90D9" />}
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ color: entry.actor === 'jarvis' ? '#C9A84C' : '#4A90D9', fontSize: '11px', fontWeight: '600' }}>
                {entry.actor === 'jarvis' ? 'Jarvis' : 'Sameer'}
              </span>
              <span style={{ color: '#aaa', fontSize: '11px' }}> {actionLabel(entry)}</span>
              <div style={{ color: '#555', fontSize: '10px', marginTop: '2px' }}>{timeAgo(entry.ts)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
