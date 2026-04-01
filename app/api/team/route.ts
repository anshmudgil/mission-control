import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const FILE = path.join(process.cwd(), 'data', 'team.json')

function readTeam() {
  if (!fs.existsSync(FILE)) return { mission: '', agents: [] }
  return JSON.parse(fs.readFileSync(FILE, 'utf-8'))
}

export async function GET() {
  return NextResponse.json(readTeam())
}

// PATCH /api/team
// Body: { agent: AgentObject }  — upserts by id
// Body: { mission: string }     — updates mission only
export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const data = readTeam()

    if (body.mission !== undefined) {
      data.mission = body.mission
    }

    if (body.agent) {
      const idx = data.agents.findIndex((a: { id: string }) => a.id === body.agent.id)
      if (idx >= 0) {
        data.agents[idx] = { ...data.agents[idx], ...body.agent }
      } else {
        data.agents.push(body.agent)
      }
    }

    fs.writeFileSync(FILE, JSON.stringify(data, null, 2))
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 })
  }
}
