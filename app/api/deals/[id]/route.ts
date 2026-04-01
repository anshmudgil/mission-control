import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DEALS_FILE = path.join(process.cwd(), 'data', 'deals.json')

function readDeals() {
  if (!fs.existsSync(DEALS_FILE)) return []
  return JSON.parse(fs.readFileSync(DEALS_FILE, 'utf-8'))
}

function writeDeals(deals: unknown[]) {
  fs.writeFileSync(DEALS_FILE, JSON.stringify(deals, null, 2))
}

// Map stage key to the timestamp field that should be auto-set when entering that stage
const STAGE_TIMESTAMPS: Record<string, string> = {
  'call-booked': 'callBookedAt',
  'call-done': 'callDoneAt',
  'soa-sent': 'soaSentAt',
  'soa-signed': 'soaSignedAt',
  'property-matched': 'propertyMatchedAt',
  'under-contract': 'underContractAt',
  'settled': 'settledAt',
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const body = await req.json()
  const deals = readDeals()
  const idx = deals.findIndex((d: Record<string, unknown>) => d.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const old = deals[idx] as Record<string, unknown>
  const now = new Date().toISOString()
  const updates: Record<string, unknown> = { ...body, updatedAt: now }

  // Auto-set the stage timestamp if stage changed and timestamp not already set
  if (body.stage && body.stage !== old.stage) {
    const tsField = STAGE_TIMESTAMPS[body.stage as string]
    if (tsField && !old[tsField]) {
      updates[tsField] = now
    }
  }

  deals[idx] = { ...old, ...updates }
  writeDeals(deals)
  return NextResponse.json(deals[idx])
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const deals = readDeals()
  const filtered = deals.filter((d: Record<string, unknown>) => d.id !== id)
  writeDeals(filtered)
  return NextResponse.json({ ok: true })
}
