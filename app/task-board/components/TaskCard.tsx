'use client'
import { Task } from '../page'
import { ChevronRight } from 'lucide-react'

const STATUS_ORDER: Task['status'][] = ['backlog', 'in-progress', 'in-review', 'done']

interface Props {
  task: Task
  onMove: (taskId: string, newStatus: string) => void
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

export default function TaskCard({ task, onMove }: Props) {
  const currentIdx = STATUS_ORDER.indexOf(task.status)
  const nextStatus = currentIdx < STATUS_ORDER.length - 1 ? STATUS_ORDER[currentIdx + 1] : null

  const assigneeColor = task.assignee === 'jarvis' ? '#C9A84C' : '#4A90D9'
  const assigneeLabel = task.assignee === 'jarvis' ? '⚡ Jarvis' : '👤 Sameer'

  return (
    <div style={{
      backgroundColor: '#212121',
      border: '1px solid #2A2A2A',
      borderRadius: '6px',
      padding: '12px',
    }}>
      <div style={{ fontSize: '13px', fontWeight: '600', color: 'white', marginBottom: '6px', lineHeight: '1.4' }}>
        {task.title}
      </div>
      {task.description && (
        <div style={{ fontSize: '12px', color: '#737373', marginBottom: '8px', lineHeight: '1.5' }}>
          {task.description.slice(0, 80)}{task.description.length > 80 ? '…' : ''}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', color: assigneeColor, fontWeight: '600' }}>{assigneeLabel}</span>
        <span style={{ fontSize: '11px', color: '#555' }}>{timeAgo(task.updatedAt)}</span>
      </div>
      {nextStatus && (
        <button
          onClick={() => onMove(task.id, nextStatus)}
          style={{
            marginTop: '8px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
            backgroundColor: 'transparent', border: '1px solid #2A2A2A', borderRadius: '4px',
            color: '#555', fontSize: '11px', padding: '4px', cursor: 'pointer',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'white'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#555' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#555'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#2A2A2A' }}
        >
          Move to {nextStatus} <ChevronRight size={12} />
        </button>
      )}
    </div>
  )
}
