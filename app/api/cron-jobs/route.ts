import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const FILE = path.join(process.cwd(), 'data', 'cron-jobs.json')

export async function GET() {
  if (!fs.existsSync(FILE)) return NextResponse.json([])
  const data = JSON.parse(fs.readFileSync(FILE, 'utf-8'))
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()
  const jobs = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf-8')) : []
  jobs.push({ ...body, createdAt: new Date().toISOString() })
  fs.writeFileSync(FILE, JSON.stringify(jobs, null, 2))
  return NextResponse.json({ ok: true })
}
