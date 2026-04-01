import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const TASKS_FILE = path.join(process.cwd(), 'data', 'tasks.json')
const ACTIVITY_FILE = path.join(process.cwd(), 'data', 'activity.jsonl')
const TEAM_FILE = path.join(process.cwd(), 'data', 'team.json')

export async function GET() {
  // Read tasks
  const tasks = fs.existsSync(TASKS_FILE)
    ? JSON.parse(fs.readFileSync(TASKS_FILE, 'utf-8'))
    : []

  // Read last 20 activity entries
  let recentActivity: any[] = []
  if (fs.existsSync(ACTIVITY_FILE)) {
    const lines = fs.readFileSync(ACTIVITY_FILE, 'utf-8').trim().split('\n').filter(Boolean)
    recentActivity = lines.slice(-20).map(l => { try { return JSON.parse(l) } catch { return null } }).filter(Boolean)
  }

  // Active jarvis tasks (in-progress)
  const activeTasks = tasks.filter((t: any) => t.assignee === 'jarvis' && t.status === 'in-progress')
  const doneTasks = tasks.filter((t: any) => t.assignee === 'jarvis' && t.status === 'done')

  // Last activity per actor
  const lastAction: Record<string, any> = {}
  for (const entry of recentActivity) {
    lastAction[entry.actor] = entry
  }

  // Determine agent states
  const agentStates = {
    jarvis: {
      status: activeTasks.length > 0 ? 'working' : 'idle',
      task: activeTasks[0]?.title || null,
      lastAction: lastAction['jarvis'] || null,
    },
    solomon: { status: 'idle', task: 'Daily brief & check-ins', lastAction: null },
    atlas: { status: 'idle', task: null, lastAction: null },
    linkedin: { status: 'working', task: 'Monitoring LinkedIn feed', lastAction: null },
    cortex: { status: 'idle', task: null, lastAction: null },
    nexus: { status: 'idle', task: 'Next audit: Sunday 9pm', lastAction: null },
    pulse: { status: 'working', task: 'Scout cycle running', lastAction: null },
  }

  return NextResponse.json({
    agentStates,
    activeTasks,
    recentActivity: recentActivity.slice(-10).reverse(),
    totalDone: doneTasks.length,
  })
}
