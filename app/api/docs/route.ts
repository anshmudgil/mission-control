import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DOCS_FILE = path.join(process.cwd(), 'data', 'docs.json')
const WORKSPACE = 'C:\\Users\\samee\\.openclaw\\workspace'

function readDocs() {
  if (!fs.existsSync(DOCS_FILE)) return []
  return JSON.parse(fs.readFileSync(DOCS_FILE, 'utf-8'))
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.toLowerCase() || ''
  const type = searchParams.get('type') || ''

  let docs = readDocs()

  if (q) {
    docs = docs.filter((d: any) =>
      d.title.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      d.project.toLowerCase().includes(q) ||
      d.tags.some((t: string) => t.toLowerCase().includes(q))
    )
  }

  if (type) {
    docs = docs.filter((d: any) => d.type === type)
  }

  return NextResponse.json(docs)
}

export async function POST(req: Request) {
  const body = await req.json()
  const docs = readDocs()
  const newDoc = {
    ...body,
    id: `doc-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  docs.unshift(newDoc)
  fs.writeFileSync(DOCS_FILE, JSON.stringify(docs, null, 2))
  return NextResponse.json(newDoc, { status: 201 })
}
