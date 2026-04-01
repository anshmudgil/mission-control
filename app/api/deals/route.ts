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

export async function GET() {
  return NextResponse.json(readDeals())
}

export async function POST(req: Request) {
  const body = await req.json()
  const deals = readDeals()
  const now = new Date().toISOString()
  const newDeal = {
    id: `deal-${Date.now()}`,
    leadName: body.leadName || '',
    email: body.email || '',
    phone: body.phone || '',
    specialty: body.specialty || '',
    company: body.company || '',
    income: body.income || '',
    stage: body.stage || 'waitlist',
    source: body.source || 'outreach',
    notes: body.notes || '',
    callBookedAt: null,
    callDoneAt: null,
    soaSentAt: null,
    soaSignedAt: null,
    propertyMatchedAt: null,
    underContractAt: null,
    settledAt: null,
    createdAt: now,
    updatedAt: now,
  }
  deals.push(newDeal)
  writeDeals(deals)
  return NextResponse.json(newDeal, { status: 201 })
}
