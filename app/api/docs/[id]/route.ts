import { NextResponse, NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'

const DOCS_FILE = path.join(process.cwd(), 'data', 'docs.json')
const WORKSPACE = '/Users/anshmudgil/.openclaw/workspace'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  
  try {
    const docs = JSON.parse(fs.readFileSync(DOCS_FILE, 'utf-8'))
    const doc = docs.find((d: any) => d.id === id)
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Read actual file content
    let content = ''
    if (doc.filePath) {
      const fullPath = path.join(WORKSPACE, doc.filePath)
      if (fs.existsSync(fullPath)) {
        content = fs.readFileSync(fullPath, 'utf-8')
      }
    }

    return NextResponse.json({ ...doc, content })
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
