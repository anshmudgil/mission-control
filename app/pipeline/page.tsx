'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, ChevronLeft, ChevronRight, X, GitMerge } from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Deal {
  id: string
  leadName: string
  email: string
  phone: string
  specialty: string
  company: string
  income: string
  stage: StageKey
  source: 'outreach' | 'waitlist' | 'referral'
  notes: string
  callBookedAt: string | null
  callDoneAt: string | null
  soaSentAt: string | null
  soaSignedAt: string | null
  propertyMatchedAt: string | null
  underContractAt: string | null
  settledAt: string | null
  createdAt: string
  updatedAt: string
}

export type StageKey =
  | 'waitlist'
  | 'call-booked'
  | 'call-done'
  | 'soa-sent'
  | 'soa-signed'
  | 'property-matched'
  | 'under-contract'
  | 'settled'

// ─── Stage config ────────────────────────────────────────────────────────────

const STAGES: { key: StageKey; label: string; color: string; bg: string }[] = [
  { key: 'waitlist',          label: 'Waitlist',          color: '#737373', bg: '#1A1A1A' },
  { key: 'call-booked',       label: 'Call Booked',       color: '#4A90D9', bg: '#1A1A1A' },
  { key: 'call-done',         label: 'Call Done',         color: '#A855F7', bg: '#1A1A1A' },
  { key: 'soa-sent',          label: 'SOA Sent',          color: '#C9A84C', bg: '#1A1A1A' },
  { key: 'soa-signed',        label: 'SOA Signed',        color: '#F97316', bg: '#1A1A1A' },
  { key: 'property-matched',  label: 'Property Matched',  color: '#06B6D4', bg: '#1A1A1A' },
  { key: 'under-contract',    label: 'Under Contract',    color: '#22c55e', bg: '#1A1A1A' },
  { key: 'settled',           label: 'Settled',           color: '#C9A84C', bg: '#1A1A1A' },
]

const STAGE_KEYS = STAGES.map(s => s.key)

// Stage → which timestamp gets set on entry
const STAGE_TIMESTAMP_LABEL: Record<StageKey, string | null> = {
  'waitlist':         null,
  'call-booked':      'Call booked',
  'call-done':        'Call done',
  'soa-sent':         'SOA sent',
  'soa-signed':       'SOA signed',
  'property-matched': 'Property matched',
  'under-contract':   'Under contract',
  'settled':          'Settled',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function daysInStage(deal: Deal): number {
  const stageTs = getStageTimestamp(deal)
  const ref = stageTs ? new Date(stageTs) : new Date(deal.updatedAt)
  return Math.max(1, Math.ceil((Date.now() - ref.getTime()) / 86400000))
}

function getStageTimestamp(deal: Deal): string | null {
  const map: Record<StageKey, string | null> = {
    'waitlist':         null,
    'call-booked':      deal.callBookedAt,
    'call-done':        deal.callDoneAt,
    'soa-sent':         deal.soaSentAt,
    'soa-signed':       deal.soaSignedAt,
    'property-matched': deal.propertyMatchedAt,
    'under-contract':   deal.underContractAt,
    'settled':          deal.settledAt,
  }
  return map[deal.stage]
}

const SOURCE_COLORS: Record<string, string> = {
  outreach: '#4A90D9',
  referral: '#22c55e',
  waitlist: '#737373',
}

// ─── Add Deal Modal ───────────────────────────────────────────────────────────

interface AddDealModalProps {
  onClose: () => void
  onCreate: (data: Partial<Deal>) => Promise<void>
}

function AddDealModal({ onClose, onCreate }: AddDealModalProps) {
  const [form, setForm] = useState<{
    leadName: string; email: string; phone: string; specialty: string;
    company: string; income: string; stage: StageKey;
    source: 'outreach' | 'waitlist' | 'referral'; notes: string;
  }>({
    leadName: '', email: '', phone: '', specialty: '',
    company: '', income: '$300k+', stage: 'waitlist',
    source: 'outreach', notes: '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.leadName.trim()) return
    setSaving(true)
    await onCreate(form)
    setSaving(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', background: '#111',
    border: '1px solid #2A2A2A', borderRadius: '6px',
    color: 'white', fontSize: '14px', boxSizing: 'border-box',
    outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', color: '#737373', fontSize: '12px',
    fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px',
        width: '480px', maxHeight: '90vh', overflow: 'auto',
        padding: '24px', position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '700', margin: 0 }}>Add Deal</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Lead Name *</label>
            <input style={inputStyle} value={form.leadName} onChange={e => set('leadName', e.target.value)} placeholder="Dr. Jane Smith" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" type="email" />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="04xx xxx xxx" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Specialty</label>
              <input style={inputStyle} value={form.specialty} onChange={e => set('specialty', e.target.value)} placeholder="GP, Surgeon, etc." />
            </div>
            <div>
              <label style={labelStyle}>Company / Clinic</label>
              <input style={inputStyle} value={form.company} onChange={e => set('company', e.target.value)} placeholder="Sydney Clinic" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Income</label>
              <select style={inputStyle} value={form.income} onChange={e => set('income', e.target.value)}>
                {['$200k+', '$300k+', '$400k+', '$500k+', '$600k+', '$700k+'].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Stage</label>
              <select style={inputStyle} value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value as StageKey }))}>
                {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Source</label>
              <select style={inputStyle} value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value as 'outreach' | 'waitlist' | 'referral' }))}>
                <option value="outreach">Outreach</option>
                <option value="referral">Referral</option>
                <option value="waitlist">Waitlist</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }}
              value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Any context..."
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button type="button" onClick={onClose} style={{
              padding: '8px 16px', background: 'transparent', border: '1px solid #2A2A2A',
              borderRadius: '6px', color: '#737373', cursor: 'pointer', fontSize: '14px',
            }}>Cancel</button>
            <button type="submit" disabled={saving} style={{
              padding: '8px 20px', background: '#C9A84C', border: 'none',
              borderRadius: '6px', color: '#0F0F0F', fontWeight: '700', cursor: 'pointer', fontSize: '14px',
            }}>{saving ? 'Adding…' : 'Add Deal'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Deal Card ────────────────────────────────────────────────────────────────

interface DealCardProps {
  deal: Deal
  stageIndex: number
  onMove: (dealId: string, newStage: StageKey) => Promise<void>
}

function DealCard({ deal, stageIndex, onMove }: DealCardProps) {
  const [hovered, setHovered] = useState(false)
  const stageTs = getStageTimestamp(deal)
  const tsLabel = STAGE_TIMESTAMP_LABEL[deal.stage]
  const days = daysInStage(deal)
  const stageColor = STAGES[stageIndex]?.color ?? '#737373'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#111',
        border: '1px solid #2A2A2A',
        borderRadius: '8px',
        padding: '12px',
        transition: 'box-shadow 0.15s, transform 0.15s',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.5)' : 'none',
        transform: hovered ? 'translateY(-1px)' : 'none',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ color: 'white', fontWeight: '700', fontSize: '14px', lineHeight: '1.3' }}>
          {deal.leadName}
        </span>
        <span style={{
          background: SOURCE_COLORS[deal.source] + '22',
          color: SOURCE_COLORS[deal.source],
          fontSize: '10px', fontWeight: '600', borderRadius: '4px',
          padding: '2px 6px', whiteSpace: 'nowrap', marginLeft: '6px',
          textTransform: 'capitalize',
        }}>
          {deal.source}
        </span>
      </div>

      {/* Sub info */}
      <div style={{ color: '#737373', fontSize: '12px', marginBottom: '8px' }}>
        {deal.specialty}{deal.company ? ` · ${deal.company}` : ''}
      </div>

      {/* Badges row */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
        <span style={{
          background: '#C9A84C22', color: '#C9A84C',
          fontSize: '11px', fontWeight: '600', borderRadius: '4px', padding: '2px 7px',
        }}>
          {deal.income}
        </span>
        <span style={{
          background: stageColor + '15', color: stageColor,
          fontSize: '11px', fontWeight: '600', borderRadius: '4px', padding: '2px 7px',
        }}>
          Day {days}
        </span>
      </div>

      {/* Stage timestamp */}
      {stageTs && tsLabel && (
        <div style={{ color: '#555', fontSize: '11px', marginBottom: '8px' }}>
          {tsLabel} {timeAgo(stageTs)}
        </div>
      )}

      {/* Prev / Next arrows */}
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
        {stageIndex > 0 && (
          <button
            onClick={() => onMove(deal.id, STAGE_KEYS[stageIndex - 1])}
            title={`Move to ${STAGES[stageIndex - 1].label}`}
            style={{
              background: '#2A2A2A', border: 'none', borderRadius: '4px',
              color: '#737373', cursor: 'pointer', padding: '4px 8px',
              display: 'flex', alignItems: 'center',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#333')}
            onMouseLeave={e => (e.currentTarget.style.background = '#2A2A2A')}
          >
            <ChevronLeft size={13} />
          </button>
        )}
        {stageIndex < STAGES.length - 1 && (
          <button
            onClick={() => onMove(deal.id, STAGE_KEYS[stageIndex + 1])}
            title={`Move to ${STAGES[stageIndex + 1].label}`}
            style={{
              background: '#2A2A2A', border: 'none', borderRadius: '4px',
              color: '#737373', cursor: 'pointer', padding: '4px 8px',
              display: 'flex', alignItems: 'center',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#333')}
            onMouseLeave={e => (e.currentTarget.style.background = '#2A2A2A')}
          >
            <ChevronRight size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Pipeline Board ───────────────────────────────────────────────────────────

interface PipelineBoardProps {
  deals: Deal[]
  onMove: (dealId: string, newStage: StageKey) => Promise<void>
}

function PipelineBoard({ deals, onMove }: PipelineBoardProps) {
  return (
    <div style={{ display: 'flex', gap: '12px', flex: 1, overflow: 'auto', paddingBottom: '8px' }}>
      {STAGES.map((stage, idx) => {
        const colDeals = deals.filter(d => d.stage === stage.key)
        return (
          <div key={stage.key} style={{
            flex: '0 0 210px', minWidth: '210px',
            backgroundColor: '#1A1A1A',
            borderRadius: '8px',
            padding: '12px',
            border: '1px solid #2A2A2A',
            display: 'flex', flexDirection: 'column', gap: '8px',
          }}>
            {/* Column header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stage.color, flexShrink: 0 }} />
              <span style={{
                color: '#aaa', fontSize: '11px', fontWeight: '600',
                textTransform: 'uppercase', letterSpacing: '0.05em', flex: 1,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {stage.label}
              </span>
              <span style={{
                background: '#2A2A2A', color: '#555',
                fontSize: '11px', fontWeight: '600', borderRadius: '10px',
                padding: '1px 7px', flexShrink: 0,
              }}>
                {colDeals.length}
              </span>
            </div>

            {/* Cards */}
            {colDeals.length > 0
              ? colDeals.map(deal => (
                  <DealCard key={deal.id} deal={deal} stageIndex={idx} onMove={onMove} />
                ))
              : (
                <div style={{
                  border: '1px dashed #2A2A2A', borderRadius: '8px',
                  padding: '24px 12px', textAlign: 'center',
                  color: '#444', fontSize: '12px', flex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  No deals
                </div>
              )
            }
          </div>
        )
      })}
    </div>
  )
}

// ─── Stats Bar ───────────────────────────────────────────────────────────────

function StatsBar({ deals }: { deals: Deal[] }) {
  const totalDeals = deals.length
  const callsBooked = deals.filter(d => d.stage !== 'waitlist').length
  const underContract = deals.filter(d => d.stage === 'under-contract').length
  const settled = deals.filter(d => d.stage === 'settled').length
  const pipelineValue = (totalDeals * 699000).toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 })

  const stats = [
    { label: 'Total Deals', value: totalDeals, color: '#737373' },
    { label: 'Calls Booked', value: callsBooked, color: '#4A90D9' },
    { label: 'Under Contract', value: underContract, color: '#22c55e' },
    { label: 'Settled', value: settled, color: '#C9A84C' },
    { label: 'Pipeline Value', value: pipelineValue, color: '#C9A84C' },
  ]

  return (
    <div style={{
      display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap',
    }}>
      {stats.map(stat => (
        <div key={stat.label} style={{
          background: '#1A1A1A', border: '1px solid #2A2A2A',
          borderRadius: '8px', padding: '12px 20px', flex: '1 1 140px',
          minWidth: '120px',
        }}>
          <div style={{ color: '#555', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            {stat.label}
          </div>
          <div style={{ color: stat.color, fontSize: '22px', fontWeight: '700' }}>
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [showModal, setShowModal] = useState(false)

  const loadDeals = useCallback(async () => {
    const res = await fetch('/api/deals')
    const data = await res.json()
    setDeals(data)
  }, [])

  useEffect(() => {
    loadDeals()
    const interval = setInterval(loadDeals, 30000)
    return () => clearInterval(interval)
  }, [loadDeals])

  const moveStage = async (dealId: string, newStage: StageKey) => {
    await fetch(`/api/deals/${dealId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    })
    loadDeals()
  }

  const createDeal = async (data: Partial<Deal>) => {
    await fetch('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    loadDeals()
    setShowModal(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <GitMerge size={20} color="#C9A84C" />
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '2px', margin: 0 }}>
              Deal Pipeline
            </h1>
            <p style={{ color: '#737373', fontSize: '14px', margin: 0 }}>
              Track leads from waitlist to settlement.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            backgroundColor: '#C9A84C', color: '#0F0F0F',
            border: 'none', borderRadius: '6px', padding: '8px 16px',
            fontWeight: '600', fontSize: '14px', cursor: 'pointer',
          }}
        >
          <Plus size={16} /> Add Deal
        </button>
      </div>

      {/* Stats */}
      <div style={{ flexShrink: 0 }}>
        <StatsBar deals={deals} />
      </div>

      {/* Board */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <PipelineBoard deals={deals} onMove={moveStage} />
      </div>

      {showModal && (
        <AddDealModal onClose={() => setShowModal(false)} onCreate={createDeal} />
      )}
    </div>
  )
}
