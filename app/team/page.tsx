'use client'

import { useState, useEffect, useCallback } from 'react'
import { Zap, X, RefreshCw } from 'lucide-react'

interface Agent {
  id: string; name: string; emoji: string; avatar?: string; tier: number
  role: string; type: string; environment: string; model: string
  reportsTo: string; manages: string[]; bestAt: string[]
  description: string; status: string; telegramId?: string; location?: string
}
interface TeamData { mission: string; agents: Agent[] }

// ── Layout constants ───────────────────────────────────────────────────────
const C1_W  = 132   // tier-1 card width
const C1_G  = 16    // gap between tier-1 columns
const WK_W  = 90    // worker card width
const WK_G  = 8     // gap between worker cards
const VLINE = 24    // vertical connector height

function colW(manages: string[]): number {
  const n = manages?.length ?? 0
  if (n <= 1) return C1_W
  return Math.max(C1_W, n * WK_W + (n - 1) * WK_G)
}

// ── Colours ────────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  'always-on': '#22c55e', 'running': '#22c55e', 'on-demand': '#C9A84C',
  'cron': '#4A90D9', 'ephemeral': '#444', 'stopped': '#ef4444', 'unknown': '#444',
}
const TYPE_COLOR: Record<string, string> = {
  'orchestrator': '#C9A84C', 'telegram-bot': '#4A90D9', 'specialist': '#A855F7',
  'cron-agent': '#4A90D9', 'background-service': '#06B6D4', 'council-member': '#383838',
}
const TYPE_LABEL: Record<string, string> = {
  'orchestrator': 'Orchestrator', 'telegram-bot': 'Telegram Bot', 'specialist': 'Specialist',
  'cron-agent': 'Cron Agent', 'background-service': 'Background', 'council-member': 'Council',
}

// ── Line helpers ───────────────────────────────────────────────────────────
const V = ({ h = VLINE, dim = false }: { h?: number; dim?: boolean }) => (
  <div style={{ width: 2, height: h, backgroundColor: dim ? '#1E1E1E' : '#2A2A2A', flexShrink: 0 }} />
)

// ── Page ───────────────────────────────────────────────────────────────────
export default function TeamPage() {
  const [data, setData]             = useState<TeamData>({ mission: '', agents: [] })
  const [live, setLive]             = useState<Record<string, string>>({})
  const [selected, setSelected]     = useState<Agent | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [checking, setChecking]     = useState(false)

  const fetchStatus = useCallback(async () => {
    setChecking(true)
    try { setLive(await (await fetch('/api/agent-status')).json()); setLastChecked(new Date()) }
    catch { /* ignore */ }
    setChecking(false)
  }, [])

  useEffect(() => {
    fetch('/api/team').then(r => r.json()).then(setData)
    fetchStatus()
    const iv = setInterval(fetchStatus, 30000)
    return () => clearInterval(iv)
  }, [fetchStatus])

  const byId   = (id: string) => data.agents.find(a => a.id === id)
  const status = (a: Agent)   => live[a.id] ?? a.status

  const jarvis = data.agents.find(a => a.id === 'jarvis')
  const tier1  = data.agents.filter(a => a.tier === 1)

  // Column widths per tier-1 agent
  const cols      = tier1.map(a => colW(a.manages ?? []))
  const totalW    = cols.reduce((s, c) => s + c, 0) + Math.max(0, tier1.length - 1) * C1_G
  // Bracket: from centre of first col to centre of last col
  const bLeft     = cols.length ? cols[0] / 2 : 0
  const bRight    = cols.length ? cols[cols.length - 1] / 2 : 0
  const bWidth    = totalW - bLeft - bRight

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden', backgroundColor: '#0D0D0D' }}>

      {/* ── Canvas ── */}
      <div style={{ flex: 1, overflow: 'auto', padding: '32px 40px' }}>

        {/* Mission */}
        {data.mission && (
          <div style={{
            background: 'linear-gradient(135deg,#1a1400,#1C1C1C)', borderLeft: '4px solid #C9A84C',
            border: '1px solid #2a2000', borderRadius: 10, padding: '16px 22px', marginBottom: 40,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Zap size={12} color="#C9A84C" />
                <span style={{ color: '#C9A84C', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mission</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {lastChecked && <span style={{ color: '#333', fontSize: 10 }}>Live: {lastChecked.toLocaleTimeString()}</span>}
                <button onClick={fetchStatus} disabled={checking} style={{ background: 'none', border: '1px solid #222', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', color: '#444', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <RefreshCw size={10} style={{ animation: checking ? 'spin 1s linear infinite' : 'none' }} />
                  <span style={{ fontSize: 10 }}>Refresh</span>
                </button>
              </div>
            </div>
            <p style={{ color: '#ccc', fontSize: 13, fontWeight: 500, lineHeight: 1.6, margin: 0 }}>&ldquo;{data.mission}&rdquo;</p>
          </div>
        )}

        {/* ── Tree ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* Sameer */}
          <SameerCard />
          <V />

          {/* Jarvis */}
          {jarvis && (
            <AgentNode agent={jarvis} status={status(jarvis)} selected={selected?.id === jarvis.id}
              onClick={() => setSelected(selected?.id === jarvis.id ? null : jarvis)}
              accent="#C9A84C" width={C1_W + 20}
            />
          )}

          {/* Jarvis → tier-1 connector + tier-1 row */}
          {tier1.length > 0 && (
            <div style={{ width: totalW, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

              {/* VLine + H-bracket in one block, precisely positioned */}
              <div style={{ position: 'relative', width: totalW, height: VLINE + 2, flexShrink: 0 }}>
                {/* Vertical drop from Jarvis */}
                <div style={{ position: 'absolute', left: totalW / 2 - 1, top: 0, width: 2, height: VLINE, backgroundColor: '#2A2A2A' }} />
                {/* Horizontal bracket */}
                <div style={{ position: 'absolute', left: bLeft, top: VLINE, width: bWidth, height: 2, backgroundColor: '#2A2A2A' }} />
              </div>

              {/* Tier-1 columns */}
              <div style={{ display: 'flex', gap: C1_G, alignItems: 'flex-start' }}>
                {tier1.map((agent, i) => {
                  const cw      = cols[i]
                  const workers = (agent.manages ?? []).map(id => byId(id)).filter((a): a is Agent => !!a)
                  const accent  = TYPE_COLOR[agent.type] || '#4A90D9'
                  const wTotal  = workers.length * WK_W + Math.max(0, workers.length - 1) * WK_G

                  return (
                    <div key={agent.id} style={{ width: cw, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                      {/* Drop from bracket */}
                      <V />

                      {/* Tier-1 card */}
                      <AgentNode agent={agent} status={status(agent)}
                        selected={selected?.id === agent.id}
                        onClick={() => setSelected(selected?.id === agent.id ? null : agent)}
                        accent={accent} width={C1_W}
                      />

                      {/* Workers sub-tree */}
                      {workers.length > 0 && (
                        <>
                          <V dim />

                          {workers.length === 1 ? (
                            <AgentNode agent={workers[0]} status={status(workers[0])}
                              selected={selected?.id === workers[0].id}
                              onClick={() => setSelected(selected?.id === workers[0].id ? null : workers[0])}
                              accent="#2A2A2A" width={WK_W} worker
                            />
                          ) : (
                            <>
                              {/* Worker H-bracket — exactly spans worker cards */}
                              <div style={{ width: wTotal, height: 2, backgroundColor: '#1E1E1E' }} />
                              {/* Worker cards */}
                              <div style={{ display: 'flex', gap: WK_G, alignItems: 'flex-start' }}>
                                {workers.map(w => (
                                  <div key={w.id} style={{ width: WK_W, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <V h={VLINE - 4} dim />
                                    <AgentNode agent={w} status={status(w)}
                                      selected={selected?.id === w.id}
                                      onClick={() => setSelected(selected?.id === w.id ? null : w)}
                                      accent="#2A2A2A" width={WK_W} worker
                                    />
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Detail panel ── */}
      {selected && (
        <div style={{ width: 290, flexShrink: 0, backgroundColor: '#0F0F0F', borderLeft: '1px solid #1A1A1A', padding: 22, overflow: 'auto', height: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', backgroundColor: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {selected.avatar
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={selected.avatar} alt={selected.name} width={44} height={44} style={{ objectFit: 'cover' }} />
                : <span style={{ fontSize: 22 }}>{selected.emoji}</span>}
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444' }}><X size={14} /></button>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ color: 'white', fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{selected.name}</div>
            <div style={{ color: '#555', fontSize: 11, marginBottom: 10 }}>{selected.role}</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <Badge label={TYPE_LABEL[selected.type] || selected.type} color={TYPE_COLOR[selected.type] || '#555'} />
              <Badge label={live[selected.id] ?? selected.status} color={STATUS_COLOR[live[selected.id] ?? selected.status] || '#555'} dot />
            </div>
          </div>

          <p style={{ color: '#666', fontSize: 12, lineHeight: 1.65, margin: '0 0 16px' }}>{selected.description}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <DR label="Environment" value={selected.environment} />
            <DR label="Model"       value={selected.model} />
            {selected.location   && <DR label="Location"    value={selected.location}   mono />}
            {selected.telegramId && <DR label="Telegram ID" value={selected.telegramId} mono />}
          </div>

          {selected.bestAt?.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ color: '#333', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Best At</div>
              {selected.bestAt.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'flex-start' }}>
                  <span style={{ color: '#C9A84C', flexShrink: 0, marginTop: 2 }}>▸</span>
                  <span style={{ color: '#555', fontSize: 11, lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Agent node card ────────────────────────────────────────────────────────
function AgentNode({ agent, status, selected, onClick, accent, width, worker }: {
  agent: Agent; status: string; selected: boolean; onClick: () => void
  accent: string; width: number; worker?: boolean
}) {
  const sc  = STATUS_COLOR[status] || '#444'
  const pad = worker ? '9px 10px' : '13px'

  return (
    <div onClick={onClick} style={{
      width, backgroundColor: selected ? '#1A1A1A' : '#111',
      border: `1px solid ${selected ? accent + '80' : '#1E1E1E'}`,
      borderTop: `2px solid ${accent}`,
      borderRadius: 8, padding: pad, cursor: 'pointer', textAlign: 'center', flexShrink: 0,
      transition: 'background-color 0.12s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#161616' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = selected ? '#1A1A1A' : '#111' }}
    >
      {/* Avatar */}
      <div style={{ width: worker ? 28 : 36, height: worker ? 28 : 36, borderRadius: '50%', overflow: 'hidden', backgroundColor: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 7px' }}>
        {agent.avatar
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={agent.avatar} alt={agent.name} width={worker ? 28 : 36} height={worker ? 28 : 36} style={{ objectFit: 'cover' }} />
          : <span style={{ fontSize: worker ? 13 : 18 }}>{agent.emoji}</span>}
      </div>
      {/* Name */}
      <div style={{ color: 'white', fontSize: worker ? 10 : 12, fontWeight: 700, lineHeight: 1.25, marginBottom: worker ? 0 : 3 }}>{agent.name}</div>
      {/* Role (only non-worker) */}
      {!worker && <div style={{ color: '#444', fontSize: 9.5, lineHeight: 1.3, marginBottom: 8 }}>{agent.role}</div>}
      {/* Status dot */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: worker ? 5 : 0 }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: sc }} />
        <span style={{ color: sc, fontSize: 9, fontWeight: 600 }}>{status}</span>
      </div>
    </div>
  )
}

// ── Sameer card ────────────────────────────────────────────────────────────
function SameerCard() {
  return (
    <div style={{ backgroundColor: '#111', border: '1px solid #222', borderTop: '2px solid #fff', borderRadius: 8, padding: 14, width: 150, textAlign: 'center' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=sameer&backgroundColor=1a1a1a&skinColor=ae5d29&hairColor=2c1b18&topType=ShortHairShortWaved&clotheType=Hoodie&clotheColor=262E33"
        alt="Sameer" width={38} height={38} style={{ borderRadius: '50%', display: 'block', margin: '0 auto 8px' }} />
      <div style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>Sameer Chib</div>
      <div style={{ color: '#444', fontSize: 10, marginTop: 2 }}>Founder & CEO</div>
      <div style={{ marginTop: 8, display: 'inline-block', backgroundColor: '#1A1A1A', color: '#444', fontSize: 9, padding: '2px 8px', borderRadius: 4 }}>Human</div>
    </div>
  )
}

// ── Misc ───────────────────────────────────────────────────────────────────
function Badge({ label, color, dot }: { label: string; color: string; dot?: boolean }) {
  return (
    <span style={{ backgroundColor: color + '22', color, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: color, display: 'inline-block' }} />}
      {label}
    </span>
  )
}
function DR({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ color: '#333', fontSize: 10, marginBottom: 2 }}>{label}</div>
      <div style={{ color: '#777', fontSize: 11, fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-word' }}>{value}</div>
    </div>
  )
}
