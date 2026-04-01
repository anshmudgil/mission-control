'use client'

import { useState, useEffect, useCallback } from 'react'
import KanbanBoard from './components/KanbanBoard'
import ActivityFeed from './components/ActivityFeed'
import NewTaskModal from './components/NewTaskModal'
import { Plus } from 'lucide-react'

export interface Task {
  id: string
  title: string
  description: string
  assignee: 'sameer' | 'jarvis'
  status: 'backlog' | 'in-progress' | 'in-review' | 'done'
  createdAt: string
  updatedAt: string
}

export default function TaskBoardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [showModal, setShowModal] = useState(false)

  const loadTasks = useCallback(async () => {
    const res = await fetch('/api/tasks')
    const data = await res.json()
    setTasks(data)
  }, [])

  useEffect(() => {
    loadTasks()
    const interval = setInterval(loadTasks, 5000)
    return () => clearInterval(interval)
  }, [loadTasks])

  const moveTask = async (taskId: string, newStatus: string) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    loadTasks()
  }

  const createTask = async (data: { title: string; description: string; assignee: string }) => {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    loadTasks()
    setShowModal(false)
  }

  return (
    <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 64px)' }}>
      {/* Main board */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>Task Board</h1>
            <p style={{ color: '#737373', fontSize: '14px' }}>Manage tasks, priorities and sprints.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: '#C9A84C', color: '#0F0F0F',
              border: 'none', borderRadius: '6px', padding: '8px 16px',
              fontWeight: '600', fontSize: '14px', cursor: 'pointer',
            }}
          >
            <Plus size={16} /> New Task
          </button>
        </div>
        <KanbanBoard tasks={tasks} onMove={moveTask} />
      </div>

      {/* Activity feed */}
      <div style={{ width: '280px', flexShrink: 0 }}>
        <ActivityFeed />
      </div>

      {showModal && (
        <NewTaskModal onClose={() => setShowModal(false)} onCreate={createTask} />
      )}
    </div>
  )
}
