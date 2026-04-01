import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const EMAILS_FILE  = path.join(process.cwd(), 'data', 'emails.json')
const POLLER_SCRIPT = path.join(process.cwd(), 'scripts', 'gmail_poller.py')
const PYTHON = 'C:\\Users\\samee\\AppData\\Local\\Python\\pythoncore-3.14-64\\python.exe'

function readEmails(): object[] {
  try {
    if (!fs.existsSync(EMAILS_FILE)) return []
    return JSON.parse(fs.readFileSync(EMAILS_FILE, 'utf-8'))
  } catch {
    return []
  }
}

function emailsAge(): number {
  try {
    const stat = fs.statSync(EMAILS_FILE)
    return Date.now() - stat.mtimeMs
  } catch {
    return Infinity
  }
}

export async function GET() {
  // Refresh if stale > 5 minutes
  if (emailsAge() > 5 * 60 * 1000) {
    try {
      execSync(`"${PYTHON}" "${POLLER_SCRIPT}"`, { timeout: 30000 })
    } catch (e) {
      // Poller failed — return stale data rather than erroring
      console.warn('Gmail poller failed:', e)
    }
  }
  return NextResponse.json(readEmails())
}

// POST /api/inbox/refresh — force refresh
export async function POST() {
  try {
    execSync(`"${PYTHON}" "${POLLER_SCRIPT}"`, { timeout: 30000 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
  return NextResponse.json(readEmails())
}
