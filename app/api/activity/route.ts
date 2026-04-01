import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const ACTIVITY_FILE = path.join(process.cwd(), 'data', 'activity.jsonl')

export async function GET() {
  if (!fs.existsSync(ACTIVITY_FILE)) return NextResponse.json([])
  const lines = fs.readFileSync(ACTIVITY_FILE, 'utf-8').trim().split('\n').filter(Boolean)
  const entries = lines.map(l => { try { return JSON.parse(l) } catch { return null } }).filter(Boolean)
  return NextResponse.json(entries.slice(-50).reverse())
}

export async function POST(req: Request) {
  const body = await req.json()
  const line = JSON.stringify({ ts: new Date().toISOString(), ...body }) + '\n'
  fs.appendFileSync(ACTIVITY_FILE, line)
  return NextResponse.json({ ok: true })
}
