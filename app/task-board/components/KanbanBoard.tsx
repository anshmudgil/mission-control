'use client'
import { Task } from '../page'
import TaskCard from './TaskCard'

const COLUMNS: { key: Task['status']; label: string; color: string }[] = [
  { key: 'backlog', label: 'Backlog', color: '#737373' },
  { key: 'in-progress', label: 'In Progress', color: '#C9A84C' },
  { key: 'in-review', label: 'In Review', color: '#4A90D9' },
  { key: 'done', label: 'Done', color: '#4CAF50' },
]

interface Props {
  tasks: Task[]
  onMove: (taskId: string, newStatus: string) => void
}

export default function KanbanBoard({ tasks, onMove }: Props) {
  return (
    <div style={{ display: 'flex', gap: '16px', flex: 1, overflow: 'auto' }}>
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.key)
        return (
          <div key={col.key} style={{
            flex: 1, minWidth: '220px',
            backgroundColor: '#1A1A1A',
            borderRadius: '8px',
            padding: '12px',
            border: '1px solid #2A2A2A',
            display: 'flex', flexDirection: 'column', gap: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: col.color }} />
              <span style={{ color: '#aaa', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {col.label}
              </span>
              <span style={{ marginLeft: 'auto', color: '#555', fontSize: '12px' }}>{colTasks.length}</span>
            </div>
            {colTasks.map(task => (
              <TaskCard key={task.id} task={task} onMove={onMove} />
            ))}
          </div>
        )
      })}
    </div>
  )
}
