'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Calendar, User, ChevronRight, AlertCircle } from 'lucide-react'

interface Project {
  id: string
  name: string
  type: string
  status: string
  stage: string
  stageIndex: number
  value: number | null
  currency: string
  contact: string
  description: string
  nextAction: string
  nextActionDue: string | null
  tags: string[]
  phase: string
  notes: string
  createdAt: string
  updatedAt: string
  color: string
}

const STAGES = [
  { key: 'identified', label: 'Identified', color: '#555' },
  { key: 'outreach', label: 'Outreach', color: '#737373' },
  { key: 'discovery', label: 'Discovery', color: '#4A90D9' },
  { key: 'proposal', label: 'Proposal', color: '#C9A84C' },
  { key: 'closing', label: 'Closing', color: '#F97316' },
  { key: 'production', label: 'Production', color: '#A855F7' },
  { key: 'done', label: 'Done', color: '#4CAF50' },
]

const TYPE_COLOR: Record<string, string> = {
  client: '#C9A84C',
  prospect: '#4A90D9',
  product: '#A855F7',
  internal: '#737373',
}

function formatValue(value: number | null, currency: string): string {
  if (value === null) return 'TBD'
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}

function isOverdue(due: string | null): boolean {
  if (!due) return false
  return new Date(due) < new Date()
}

function formatDue(due: string | null): string {
  if (!due) return 'No deadline'
  const d = new Date(due)
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selected, setSelected] = useState<Project | null>(null)

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(setProjects)
  }, [])

  const totalPipeline = projects.filter(p => p.value && p.status !== 'winding-down').reduce((s, p) => s + (p.value || 0), 0)
  const activeDeals = projects.filter(p => p.status === 'active').length

  return (
    <div style={{ display: 'flex', gap: '0', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingRight: selected ? '24px' : '0' }}>

        {/* Header */}
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>Projects</h1>
          <p style={{ color: '#737373', fontSize: '14px' }}>Client pipeline, products, and active projects.</p>
        </div>

        {/* Pipeline summary */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '8px', padding: '16px 20px' }}>
            <div style={{ color: '#737373', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Total Pipeline</div>
            <div style={{ color: '#C9A84C', fontSize: '28px', fontWeight: '800' }}>{formatValue(totalPipeline, 'AUD')}</div>
          </div>
          <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '8px', padding: '16px 20px' }}>
            <div style={{ color: '#737373', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Active Deals</div>
            <div style={{ color: 'white', fontSize: '28px', fontWeight: '800' }}>{activeDeals}</div>
          </div>
          <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '8px', padding: '16px 20px' }}>
            <div style={{ color: '#737373', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>VPA Pending</div>
            <div style={{ color: '#F97316', fontSize: '28px', fontWeight: '800' }}>$40K</div>
          </div>
        </div>

        {/* Pipeline stages */}
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
          {STAGES.map(stage => {
            const stageProjects = projects.filter(p => p.stage === stage.key)
            return (
              <div key={stage.key} style={{ minWidth: '180px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stage.color }} />
                  <span style={{ color: '#737373', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stage.label}</span>
                  <span style={{ color: '#444', fontSize: '11px', marginLeft: 'auto' }}>{stageProjects.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {stageProjects.map(proj => (
                    <div
                      key={proj.id}
                      onClick={() => setSelected(proj)}
                      style={{
                        backgroundColor: selected?.id === proj.id ? '#222' : '#1A1A1A',
                        border: `1px solid ${selected?.id === proj.id ? proj.color + '88' : '#2A2A2A'}`,
                        borderLeft: `3px solid ${proj.color}`,
                        borderRadius: '6px',
                        padding: '10px 12px',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ color: 'white', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>{proj.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                        <span style={{ backgroundColor: (TYPE_COLOR[proj.type] || '#555') + '22', color: TYPE_COLOR[proj.type] || '#555', fontSize: '9px', fontWeight: '700', padding: '1px 6px', borderRadius: '3px' }}>{proj.type}</span>
                      </div>
                      {proj.value && (
                        <div style={{ color: '#C9A84C', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>{formatValue(proj.value, proj.currency)}</div>
                      )}
                      {proj.nextAction && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                          {isOverdue(proj.nextActionDue) && <AlertCircle size={10} color="#ef4444" style={{ marginTop: '2px', flexShrink: 0 }} />}
                          <div style={{ color: isOverdue(proj.nextActionDue) ? '#ef4444' : '#737373', fontSize: '10px', lineHeight: '1.4' }}>
                            {proj.nextAction.slice(0, 40)}{proj.nextAction.length > 40 ? '…' : ''}
                          </div>
                        </div>
                      )}
                      {proj.nextActionDue && (
                        <div style={{ color: isOverdue(proj.nextActionDue) ? '#ef4444' : '#555', fontSize: '10px', marginTop: '4px' }}>
                          Due {formatDue(proj.nextActionDue)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div style={{ width: '300px', flexShrink: 0, backgroundColor: '#181818', border: '1px solid #2A2A2A', borderRadius: '8px', padding: '20px', overflow: 'auto', height: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: selected.color }} />
            <span style={{ color: 'white', fontSize: '17px', fontWeight: '800' }}>{selected.name}</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span style={{ backgroundColor: (TYPE_COLOR[selected.type] || '#555') + '22', color: TYPE_COLOR[selected.type] || '#555', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>{selected.type}</span>
            <span style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: '#aaa', fontSize: '10px', padding: '2px 8px', borderRadius: '4px' }}>{selected.phase}</span>
          </div>
          <p style={{ color: '#aaa', fontSize: '13px', lineHeight: '1.6', marginBottom: '16px' }}>{selected.description}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
            {selected.value && <Row icon={<DollarSign size={12} />} label="Value" value={formatValue(selected.value, selected.currency)} valueColor="#C9A84C" />}
            <Row icon={<User size={12} />} label="Contact" value={selected.contact} />
            {selected.nextActionDue && <Row icon={<Calendar size={12} />} label="Due" value={formatDue(selected.nextActionDue)} valueColor={isOverdue(selected.nextActionDue) ? '#ef4444' : '#aaa'} />}
          </div>
          {selected.nextAction && (
            <div style={{ backgroundColor: '#111', border: '1px solid #2A2A2A', borderRadius: '6px', padding: '12px', marginBottom: '16px' }}>
              <div style={{ color: '#555', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Next Action</div>
              <div style={{ color: isOverdue(selected.nextActionDue) ? '#ef4444' : 'white', fontSize: '13px', lineHeight: '1.5', fontWeight: '600' }}>{selected.nextAction}</div>
            </div>
          )}
          {selected.notes && (
            <div>
              <div style={{ color: '#555', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Notes</div>
              <div style={{ color: '#737373', fontSize: '12px', lineHeight: '1.6' }}>{selected.notes}</div>
            </div>
          )}
          {selected.tags?.length > 0 && (
            <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {selected.tags.map(tag => (
                <span key={tag} style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: '#555', fontSize: '10px', padding: '2px 7px', borderRadius: '4px' }}>#{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Row({ icon, label, value, valueColor }: { icon?: React.ReactNode; label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#555', fontSize: '12px' }}>{icon}{label}</div>
      <div style={{ color: valueColor || '#aaa', fontSize: '12px', fontWeight: '600' }}>{value}</div>
    </div>
  )
}
