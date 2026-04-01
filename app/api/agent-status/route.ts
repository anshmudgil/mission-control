import { NextResponse } from 'next/server'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const WORKSPACE = 'C:\\Users\\samee\\.openclaw\\workspace\\builds'

// Map agent id → pid file path (relative to WORKSPACE)
const PID_FILES: Record<string, string> = {
  solomon:            'solomon\\solomon.pid',
  linkedin:           'linkedin-agent-v6\\agent.pid',
  cortex:             'cortex\\cortex.pid',
  visync:             'vi-sync\\sync.pid',
  'discord-pipeline': 'discord-pipeline\\pipeline.pid',
  'vermilion-wealth': 'vermilion-wealth\\wealth_awareness.pid',
  vilegal:            'legal-agent\\legal.pid',
}

// Agents checked via Windows service name (NSSM) — service RUNNING = agent running
const NSSM_SERVICES: Record<string, string> = {
  atlas: 'AtlasBot',
}

// Agents that are always ephemeral/cron — never check PID
const STATIC_STATUS: Record<string, string> = {
  jarvis:                    'always-on',
  architect:                 'on-demand',
  nexus:                     'cron',
  'solomon-compass':         'ephemeral',
  'solomon-forge':           'ephemeral',
  'solomon-atlas-council':   'ephemeral',
  'solomon-ledger':          'ephemeral',
  'vermilion-reddit-worker': 'ephemeral',
  'vermilion-fb-worker':     'ephemeral',
}

function getRunningPids(): Set<number> {
  try {
    const out = execSync('tasklist /FI "IMAGENAME eq python.exe" /FO CSV', { timeout: 5000 }).toString()
    const pids = new Set<number>()
    out.split('\n').forEach(line => {
      const m = line.match(/"(\d+)"/)
      if (m) pids.add(parseInt(m[1]))
    })
    return pids
  } catch {
    return new Set()
  }
}

function checkPid(pidFile: string, runningPids: Set<number>): string {
  const fullPath = path.join(WORKSPACE, pidFile)
  if (!fs.existsSync(fullPath)) return 'unknown'
  try {
    const pid = parseInt(fs.readFileSync(fullPath, 'utf-8').trim())
    return runningPids.has(pid) ? 'running' : 'stopped'
  } catch {
    return 'unknown'
  }
}

function checkService(serviceName: string): string {
  try {
    const out = execSync(`sc.exe query "${serviceName}"`, { timeout: 5000 }).toString()
    if (out.includes('RUNNING')) return 'running'
    if (out.includes('STOPPED')) return 'stopped'
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

export async function GET() {
  const runningPids = getRunningPids()
  const statuses: Record<string, string> = {}

  // Static statuses
  for (const [id, status] of Object.entries(STATIC_STATUS)) {
    statuses[id] = status
  }

  // PID-based statuses
  for (const [id, pidFile] of Object.entries(PID_FILES)) {
    statuses[id] = checkPid(pidFile, runningPids)
  }

  // NSSM service-based statuses
  for (const [id, svcName] of Object.entries(NSSM_SERVICES)) {
    statuses[id] = checkService(svcName)
  }

  return NextResponse.json(statuses)
}
