import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const FILE = path.join(process.cwd(), 'data', 'projects.json')

function read() {
  if (!fs.existsSync(FILE)) return []
  return JSON.parse(fs.readFileSync(FILE, 'utf-8'))
}

export async function GET() {
  return NextResponse.json(read())
}

export async function POST(req: Request) {
  const body = await req.json()
  const projects = read()
  const newProj = { ...body, id: `proj-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  projects.unshift(newProj)
  fs.writeFileSync(FILE, JSON.stringify(projects, null, 2))
  return NextResponse.json(newProj, { status: 201 })
}

export async function PATCH(req: Request) {
  const body = await req.json()
  const projects = read()
  const idx = projects.findIndex((p: any) => p.id === body.id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  projects[idx] = { ...projects[idx], ...body, updatedAt: new Date().toISOString() }
  fs.writeFileSync(FILE, JSON.stringify(projects, null, 2))
  return NextResponse.json(projects[idx])
}
