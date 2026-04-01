import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const TASKS_FILE = path.join(process.cwd(), 'data', 'tasks.json')
const ACTIVITY_FILE = path.join(process.cwd(), 'data', 'activity.jsonl')

// Trello API client
class TrelloClient {
  private apiKey: string
  private token: string
  private baseUrl = 'https://api.trello.com/1'

  constructor() {
    this.apiKey = process.env.TRELLO_API_KEY || ''
    this.token = process.env.TRELLO_TOKEN || ''
  }

  async getCards(boardId: string) {
    const url = `${this.baseUrl}/boards/${boardId}/cards?key=${this.apiKey}&token=${this.token}`
    const res = await fetch(url)
    if (!res.ok) {
      console.error('Trello API error:', res.status, await res.text())
      return []
    }
    return res.json()
  }

  async updateCard(cardId: string, updates: any) {
    const url = `${this.baseUrl}/cards/${cardId}?key=${this.apiKey}&token=${this.token}`
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    return res.json()
  }
}

function readTasks() {
  if (!fs.existsSync(TASKS_FILE)) return []
  return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf-8'))
}

function writeTasks(tasks: any[]) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2))
}

function appendActivity(entry: any) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n'
  fs.appendFileSync(ACTIVITY_FILE, line)
}

// Map Trello list IDs to dashboard status
function getTrelloListId(status: string, listIds: any) {
  const map: { [key: string]: string } = {
    'backlog': listIds.backlog,
    'in-progress': listIds.inProgress,
    'in-review': listIds.inReview,
    'done': listIds.done,
  }
  return map[status] || listIds.backlog
}

export async function GET(req: Request) {
  const useCache = new URL(req.url).searchParams.get('cache') === 'true'

  // Option 1: Return cached tasks (fast)
  if (useCache) {
    return NextResponse.json(readTasks())
  }

  // Option 2: Fetch from Trello (real-time, slower)
  if (process.env.ENABLE_TRELLO_SYNC === 'true' && process.env.TRELLO_BOARD_ID) {
    try {
      const client = new TrelloClient()
      const trelloCards = await client.getCards(process.env.TRELLO_BOARD_ID)

      // Map Trello cards to dashboard tasks
      const tasks = trelloCards.map((card: any) => ({
        id: card.id,
        title: card.name,
        description: card.desc,
        assignee: card.idMembers && card.idMembers.length > 0 ? 'assigned' : 'unassigned',
        status: mapTrelloListToStatus(card.idList),
        createdAt: card.dateLastActivity,
        updatedAt: card.dateLastActivity,
        trelloId: card.id,
        trelloUrl: card.url,
      }))

      // Cache to local file
      writeTasks(tasks)
      return NextResponse.json(tasks)
    } catch (error) {
      console.error('Error fetching from Trello:', error)
      // Fall back to cache
      return NextResponse.json(readTasks())
    }
  }

  return NextResponse.json(readTasks())
}

function mapTrelloListToStatus(listId: string): string {
  // These would be your actual Trello list IDs
  // You can find them by logging the API response
  const listMap: { [key: string]: string } = {
    // 'backlog-list-id': 'backlog',
    // 'in-progress-list-id': 'in-progress',
    // 'in-review-list-id': 'in-review',
    // 'done-list-id': 'done',
  }
  return listMap[listId] || 'backlog'
}

export async function POST(req: Request) {
  const body = await req.json()
  const tasks = readTasks()
  const newTask = {
    id: `task-${Date.now()}`,
    title: body.title,
    description: body.description || '',
    assignee: body.assignee || 'sameer',
    status: 'backlog',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  tasks.push(newTask)
  writeTasks(tasks)

  appendActivity({
    actor: body.assignee || 'system',
    action: 'created',
    taskId: newTask.id,
    taskTitle: newTask.title,
    type: 'task_created',
  })

  return NextResponse.json(newTask, { status: 201 })
}
