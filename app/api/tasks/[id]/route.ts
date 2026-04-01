import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const TASKS_FILE = path.join(process.cwd(), 'data', 'tasks.json')
const ACTIVITY_FILE = path.join(process.cwd(), 'data', 'activity.jsonl')

function readTasks() {
  if (!fs.existsSync(TASKS_FILE)) return []
  return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf-8'))
}

function writeTasks(tasks: any[]) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2))
}

function appendActivity(entry: object) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n'
  fs.appendFileSync(ACTIVITY_FILE, line)
}

export async function PATCH(req: Request, context: { params: { id: string } }) {
  const { id } = context.params
  const body = await req.json()
  const tasks = readTasks()
  const idx = tasks.findIndex((t: any) => t.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const old = tasks[idx]
  tasks[idx] = { ...old, ...body, updatedAt: new Date().toISOString() }
  writeTasks(tasks)

  if (body.status && body.status !== old.status) {
    appendActivity({
      actor: body.actor || old.assignee,
      action: 'moved',
      taskId: old.id,
      taskTitle: old.title,
      from: old.status,
      to: body.status,
    })
  }

  return NextResponse.json(tasks[idx])
}

export async function DELETE(_req: Request, context: { params: { id: string } }) {
  const { id } = context.params
  const tasks = readTasks()
  const filtered = tasks.filter((t: any) => t.id !== id)
  writeTasks(filtered)
  return NextResponse.json({ ok: true })
}
