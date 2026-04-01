import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const VW_BASE = 'C:\\Users\\samee\\.openclaw\\workspace\\builds\\vermilion-wealth'
const OUTREACH_STATE = path.join(VW_BASE, 'state', 'outreach_state.json')
const NURTURE_STATE  = path.join(VW_BASE, 'state', 'nurture_state.json')
const STOCK_LIST     = path.join(VW_BASE, 'data', 'stock_list.json')

function readJson(filePath: string, fallback: unknown) {
  try {
    if (!fs.existsSync(filePath)) return fallback
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return fallback
  }
}

function getMtime(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null
    return fs.statSync(filePath).mtime.toISOString()
  } catch {
    return null
  }
}

function getScheduledTask() {
  try {
    const out = execSync('schtasks /query /tn VermilionWealthOutreach /fo LIST', { encoding: 'utf8', timeout: 5000 })
    const nextRun  = out.match(/Next Run Time:\s*(.+)/i)?.[1]?.trim() ?? null
    const lastRun  = out.match(/Last Run Time:\s*(.+)/i)?.[1]?.trim() ?? null
    const status   = out.match(/Status:\s*(.+)/i)?.[1]?.trim() ?? null
    return { nextRun, lastRun, status, found: true }
  } catch {
    return { nextRun: 'Tomorrow 9:00 AM', lastRun: null, status: 'Unknown', found: false }
  }
}

async function getOllamaStatus(): Promise<{ ollamaOnline: boolean; model: string }> {
  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 2000)
    const res = await fetch('http://localhost:11434/api/tags', { signal: controller.signal })
    clearTimeout(id)
    return { ollamaOnline: res.ok, model: 'qwen3.5:9b' }
  } catch {
    return { ollamaOnline: false, model: 'qwen3.5:9b' }
  }
}

export async function GET() {
  const outreach = readJson(OUTREACH_STATE, { sent: {}, failed: {}, skipped: {}, daily_counts: {} }) as {
    sent: Record<string, unknown>
    failed: Record<string, unknown>
    skipped: Record<string, unknown>
    daily_counts: Record<string, number>
  }

  const nurture = readJson(NURTURE_STATE, { leads: [] }) as {
    leads?: Array<{
      id?: string
      name?: string
      email?: string
      income?: string
      status?: string
      enrolled_at?: string
      emails_sent?: number[]
    }>
  }

  const stockList = readJson(STOCK_LIST, []) as Array<{
    title: string
    price: string
    yield: string
    type: string
    highlight: string
    status: string
  }>

  const stockMtime = getMtime(STOCK_LIST)
  const scheduledTask = getScheduledTask()
  const ollama = await getOllamaStatus()

  return NextResponse.json({
    outreach,
    nurture,
    stockList,
    stockMtime,
    scheduledTask,
    ollama,
  })
}
