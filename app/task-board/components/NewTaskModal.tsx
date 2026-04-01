'use client'
import { useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  onClose: () => void
  onCreate: (data: { title: string; description: string; assignee: string }) => void
}

export default function NewTaskModal({ onClose, onCreate }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignee, setAssignee] = useState<'sameer' | 'jarvis'>('sameer')

  const inputStyle = {
    width: '100%', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A',
    borderRadius: '6px', padding: '8px 12px', color: 'white', fontSize: '14px',
    outline: 'none', boxSizing: 'border-box' as const,
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }}>
      <div style={{
        backgroundColor: '#1C1C1C', border: '1px solid #2A2A2A',
        borderRadius: '10px', padding: '24px', width: '480px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>New Task</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={18} color="#737373" />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ color: '#737373', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title..." style={inputStyle} />
          </div>
          <div>
            <label style={{ color: '#737373', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What needs to be done..." rows={3}
              style={{ ...inputStyle, resize: 'vertical' as const }} />
          </div>
          <div>
            <label style={{ color: '#737373', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Assign to</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['sameer', 'jarvis'] as const).map(a => (
                <button key={a} onClick={() => setAssignee(a)} style={{
                  flex: 1, padding: '8px', borderRadius: '6px', cursor: 'pointer',
                  border: `1px solid ${assignee === a ? '#C9A84C' : '#2A2A2A'}`,
                  backgroundColor: assignee === a ? 'rgba(201,168,76,0.1)' : '#1A1A1A',
                  color: assignee === a ? '#C9A84C' : '#737373',
                  fontSize: '13px', fontWeight: '600',
                }}>
                  {a === 'jarvis' ? '⚡ Jarvis' : '👤 Sameer'}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => title.trim() && onCreate({ title, description, assignee })}
            style={{
              backgroundColor: '#C9A84C', color: '#0F0F0F', border: 'none',
              borderRadius: '6px', padding: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
              opacity: title.trim() ? 1 : 0.5,
            }}
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  )
}
