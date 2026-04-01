import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const WORKSPACE = 'C:\\Users\\samee\\.openclaw\\workspace'
const MEMORY_DIR = path.join(WORKSPACE, 'memory')

interface MemoryEntry {
  id: string
  date: string          // YYYY-MM-DD
  topic: string | null  // null for daily summary files
  filename: string
  content: string
  wordCount: number
  type: 'daily' | 'topic' | 'detail' | 'longterm'
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.toLowerCase() || ''
  const view = searchParams.get('view') || 'timeline' // 'timeline' | 'longterm'

  const entries: MemoryEntry[] = []

  if (view === 'longterm') {
    // Load MEMORY.md + detail files
    const ltFiles = [
      { file: path.join(WORKSPACE, 'MEMORY.md'), type: 'longterm' as const, topic: 'Index' },
      { file: path.join(MEMORY_DIR, 'detail', 'businesses.md'), type: 'detail' as const, topic: 'Businesses' },
      { file: path.join(MEMORY_DIR, 'detail', 'agent_stack.md'), type: 'detail' as const, topic: 'Agent Stack' },
      { file: path.join(MEMORY_DIR, 'detail', 'academic.md'), type: 'detail' as const, topic: 'Academic' },
    ]
    for (const { file, type, topic } of ltFiles) {
      if (!fs.existsSync(file)) continue
      const content = fs.readFileSync(file, 'utf-8')
      const entry: MemoryEntry = {
        id: path.basename(file),
        date: new Date().toISOString().slice(0, 10),
        topic,
        filename: path.basename(file),
        content,
        wordCount: content.split(/\s+/).length,
        type,
      }
      if (!q || content.toLowerCase().includes(q) || topic.toLowerCase().includes(q)) {
        entries.push(entry)
      }
    }
    return NextResponse.json(entries)
  }

  // Timeline view: read all memory/*.md files
  if (!fs.existsSync(MEMORY_DIR)) return NextResponse.json([])

  const files = fs.readdirSync(MEMORY_DIR)
    .filter(f => f.endsWith('.md') && f !== 'MEMORY_ARCHITECTURE.md')
    .sort()
    .reverse()

  for (const filename of files) {
    const filepath = path.join(MEMORY_DIR, filename)
    const stat = fs.statSync(filepath)
    if (stat.isDirectory()) continue

    const content = fs.readFileSync(filepath, 'utf-8')
    // Parse filename: YYYY-MM-DD.md or YYYY-MM-DD-topic.md
    const match = filename.match(/^(\d{4}-\d{2}-\d{2})(?:-(.+))?\.md$/)
    if (!match) continue

    const date = match[1]
    const topicRaw = match[2] || null
    const topic = topicRaw ? topicRaw.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : null

    if (q && !content.toLowerCase().includes(q) && !(topic || '').toLowerCase().includes(q) && !date.includes(q)) continue

    entries.push({
      id: filename,
      date,
      topic,
      filename,
      content,
      wordCount: content.split(/\s+/).length,
      type: topic ? 'topic' : 'daily',
    })
  }

  return NextResponse.json(entries)
}
