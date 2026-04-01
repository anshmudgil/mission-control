'use client'

import { useState, useEffect } from 'react'

interface AgentState {
  status: 'working' | 'idle' | 'collaborating'
  task: string | null
  lastAction: any
}

interface OfficeData {
  agentStates: Record<string, AgentState>
  activeTasks: any[]
  recentActivity: any[]
  totalDone: number
}

// Agent definitions with desk positions and pixel colors
const AGENTS = [
  {
    id: 'jarvis',
    name: 'Jarvis',
    emoji: '⚡',
    color: '#C9A84C',
    hairColor: '#8B6914',
    skinColor: '#F4C87A',
    desk: { x: 80, y: 80 },
    deskDir: 'right',
    description: 'Chief of Staff',
  },
  {
    id: 'solomon',
    name: 'Solomon',
    emoji: '🧠',
    color: '#4A90D9',
    hairColor: '#2A5A8A',
    skinColor: '#E8C49A',
    desk: { x: 340, y: 80 },
    deskDir: 'left',
    description: 'Mentor Bot',
  },
  {
    id: 'atlas',
    name: 'ATLAS',
    emoji: '🎯',
    color: '#4CAF50',
    hairColor: '#2E7D32',
    skinColor: '#D4A875',
    desk: { x: 80, y: 260 },
    deskDir: 'right',
    description: 'Discovery Agent',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    emoji: '💼',
    color: '#0077B5',
    hairColor: '#003f6b',
    skinColor: '#F0D0B0',
    desk: { x: 340, y: 260 },
    deskDir: 'left',
    description: 'Content Engine',
  },
  {
    id: 'cortex',
    name: 'CORTEX',
    emoji: '🎬',
    color: '#EC4899',
    hairColor: '#9D174D',
    skinColor: '#FBBF9A',
    desk: { x: 80, y: 420 },
    deskDir: 'right',
    description: 'Script Writer',
  },
  {
    id: 'nexus',
    name: 'NEXUS',
    emoji: '🔍',
    color: '#A855F7',
    hairColor: '#6B21A8',
    skinColor: '#E8C49A',
    desk: { x: 340, y: 420 },
    deskDir: 'left',
    description: 'Agent Auditor',
  },
  {
    id: 'pulse',
    name: 'Pulse',
    emoji: '📡',
    color: '#06B6D4',
    hairColor: '#0E7490',
    skinColor: '#D4B896',
    desk: { x: 210, y: 80 },
    deskDir: 'down',
    description: 'Discord Pipeline',
  },
  {
    id: 'vw-outreach',
    name: 'VW Outreach',
    emoji: '📧',
    color: '#C9A84C',
    hairColor: '#8B6914',
    skinColor: '#F4C87A',
    desk: { x: 210, y: 260 },
    deskDir: 'down',
    description: 'Cold Email Sender',
  },
  {
    id: 'vw-nurture',
    name: 'VW Nurture',
    emoji: '🌱',
    color: '#22c55e',
    hairColor: '#14532d',
    skinColor: '#F4C87A',
    desk: { x: 210, y: 420 },
    deskDir: 'down',
    description: 'Waitlist Sequence',
  },
  {
    id: 'vw-ollama',
    name: 'Ollama',
    emoji: '🤖',
    color: '#A855F7',
    hairColor: '#6B21A8',
    skinColor: '#E8C49A',
    desk: { x: 420, y: 80 },
    deskDir: 'left',
    description: 'Local AI (qwen3.5)',
  },
]

// Pixel character using CSS box-shadow technique (16x16 pixel grid)
function PixelCharacter({ color, working, size = 1 }: { color: string; working: boolean; size?: number }) {
  const s = size * 4 // base pixel size
  // Simple pixel person: head + body
  return (
    <div style={{ position: 'relative', width: s * 5, height: s * 8 }}>
      {/* Head */}
      <div style={{
        position: 'absolute', top: 0, left: s,
        width: s * 3, height: s * 3,
        backgroundColor: '#F4C87A',
        border: `${s * 0.25}px solid #8B4513`,
        borderRadius: '2px',
      }} />
      {/* Eyes */}
      <div style={{ position: 'absolute', top: s * 0.8, left: s * 1.5, width: s * 0.6, height: s * 0.6, backgroundColor: '#222', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', top: s * 0.8, left: s * 2.9, width: s * 0.6, height: s * 0.6, backgroundColor: '#222', borderRadius: '50%' }} />
      {/* Body */}
      <div style={{
        position: 'absolute', top: s * 3.2, left: s * 0.5,
        width: s * 4, height: s * 3,
        backgroundColor: color,
        borderRadius: '2px',
      }} />
      {/* Legs */}
      <div style={{ position: 'absolute', top: s * 6.2, left: s, width: s * 1.3, height: s * 1.8, backgroundColor: '#555', borderRadius: '1px' }} />
      <div style={{ position: 'absolute', top: s * 6.2, left: s * 2.7, width: s * 1.3, height: s * 1.8, backgroundColor: '#555', borderRadius: '1px' }} />
      {/* Working animation: arms up */}
      {working && (
        <>
          <div style={{
            position: 'absolute', top: s * 3.5, left: -s * 0.5,
            width: s * 1, height: s * 2, backgroundColor: '#F4C87A',
            borderRadius: '2px',
            animation: 'typing 0.5s ease-in-out infinite alternate',
          }} />
          <div style={{
            position: 'absolute', top: s * 3.5, right: -s * 0.5,
            width: s * 1, height: s * 2, backgroundColor: '#F4C87A',
            borderRadius: '2px',
            animation: 'typing 0.5s ease-in-out infinite alternate-reverse',
          }} />
        </>
      )}
    </div>
  )
}

function Desk({ direction, color }: { direction: string; color: string }) {
  const deskStyle: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: '#8B6914',
    border: '2px solid #5C4400',
    borderRadius: '3px',
  }
  // Monitor on desk
  const monitorStyle: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: '#1a1a2e',
    border: `2px solid ${color}`,
    borderRadius: '2px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }

  if (direction === 'right' || direction === 'left') {
    return (
      <div style={{ position: 'relative', width: 80, height: 50 }}>
        <div style={{ ...deskStyle, width: 80, height: 50 }} />
        <div style={{ ...monitorStyle, width: 28, height: 22, top: 6, left: direction === 'right' ? 44 : 8 }}>
          <div style={{ color, fontSize: '8px' }}>▊▊▊</div>
        </div>
        {/* Keyboard */}
        <div style={{ position: 'absolute', width: 24, height: 8, backgroundColor: '#ccc', borderRadius: '1px', bottom: 8, left: direction === 'right' ? 8 : 48, opacity: 0.7 }} />
      </div>
    )
  }
  return (
    <div style={{ position: 'relative', width: 80, height: 50 }}>
      <div style={{ ...deskStyle, width: 80, height: 50 }} />
      <div style={{ ...monitorStyle, width: 28, height: 22, top: 6, left: 26 }}>
        <div style={{ color, fontSize: '8px' }}>▊▊▊</div>
      </div>
    </div>
  )
}

function WaterCooler() {
  return (
    <div style={{ position: 'absolute', right: 60, bottom: 60, width: 30, height: 50 }}>
      {/* Water jug */}
      <div style={{ width: 22, height: 28, backgroundColor: '#93C5FD', border: '2px solid #2563EB', borderRadius: '4px 4px 2px 2px', margin: '0 auto' }}>
        <div style={{ width: 12, height: 8, backgroundColor: '#BFDBFE', borderRadius: '50%', margin: '4px auto' }} />
      </div>
      {/* Stand */}
      <div style={{ width: 26, height: 22, backgroundColor: '#374151', border: '2px solid #1F2937', borderRadius: '0 0 4px 4px', margin: '0 auto' }}>
        <div style={{ width: 8, height: 6, backgroundColor: '#60A5FA', borderRadius: '1px', margin: '4px auto 0' }} />
      </div>
    </div>
  )
}

function Plant() {
  return (
    <div style={{ position: 'absolute', left: 24, bottom: 60 }}>
      <div style={{ width: 20, height: 20, backgroundColor: '#15803D', borderRadius: '50% 50% 0 50%', marginLeft: 4 }} />
      <div style={{ width: 18, height: 18, backgroundColor: '#16A34A', borderRadius: '50% 0 50% 50%', marginTop: -10 }} />
      <div style={{ width: 20, height: 14, backgroundColor: '#854D0E', border: '2px solid #713F12', borderRadius: '2px', marginTop: 2 }} />
    </div>
  )
}

export default function OfficePage() {
  const [data, setData] = useState<OfficeData | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const load = () => fetch('/api/office').then(r => r.json()).then(setData).catch(() => {})
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [])

  // Tick for animations
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 800)
    return () => clearInterval(t)
  }, [])

  const getState = (id: string): AgentState => {
    return data?.agentStates?.[id] || { status: 'idle', task: null, lastAction: null }
  }

  const OFFICE_W = 560
  const OFFICE_H = 580

  return (
    <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>

      {/* Office canvas */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>Office</h1>
          <p style={{ color: '#737373', fontSize: '13px' }}>Live agent activity — glance to see who&apos;s working on what.</p>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {[
            { label: 'Working', value: AGENTS.filter(a => getState(a.id).status === 'working').length, color: '#4CAF50' },
            { label: 'Idle', value: AGENTS.filter(a => getState(a.id).status === 'idle').length, color: '#737373' },
            { label: 'Tasks Done', value: data?.totalDone || 0, color: '#C9A84C' },
          ].map(stat => (
            <div key={stat.label} style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '6px', padding: '8px 16px' }}>
              <div style={{ color: stat.color, fontSize: '20px', fontWeight: '800' }}>{stat.value}</div>
              <div style={{ color: '#555', fontSize: '11px' }}>{stat.label}</div>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', color: '#4CAF50', fontSize: '11px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#4CAF50', animation: 'pulse 2s infinite' }} />
            Live
          </div>
        </div>

        {/* Pixel office room */}
        <div style={{
          position: 'relative',
          width: OFFICE_W,
          height: OFFICE_H,
          backgroundColor: '#1a1208',
          border: '3px solid #3a2800',
          borderRadius: '4px',
          overflow: 'hidden',
          imageRendering: 'pixelated',
          fontFamily: 'monospace',
        }}>
          {/* Floor tiles */}
          {Array.from({ length: 14 }).map((_, row) =>
            Array.from({ length: 14 }).map((_, col) => (
              <div key={`${row}-${col}`} style={{
                position: 'absolute',
                left: col * 40, top: row * 41,
                width: 40, height: 41,
                backgroundColor: (row + col) % 2 === 0 ? '#1e1708' : '#231d0a',
                borderRight: '1px solid #2a2008',
                borderBottom: '1px solid #2a2008',
              }} />
            ))
          )}

          {/* Room walls hint */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, backgroundColor: '#3a2800' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, backgroundColor: '#3a2800' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 6, backgroundColor: '#3a2800' }} />
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 6, backgroundColor: '#3a2800' }} />

          {/* Room label */}
          <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', color: '#4a3800', fontSize: '10px', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            ⚡ VERMILION INTELLIGENCE HQ
          </div>

          {/* Decorations */}
          <WaterCooler />
          <Plant />

          {/* Agents at desks */}
          {AGENTS.map(agent => {
            const state = getState(agent.id)
            const isWorking = state.status === 'working'
            const { x, y } = agent.desk

            return (
              <div key={agent.id} style={{ position: 'absolute', left: x, top: y }}>
                {/* Desk */}
                <div style={{ position: 'absolute', top: 36, left: 0 }}>
                  <Desk direction={agent.deskDir} color={agent.color} />
                </div>

                {/* Character */}
                <div style={{
                  position: 'absolute',
                  top: isWorking ? (tick % 2 === 0 ? 0 : -2) : 0,
                  left: agent.deskDir === 'right' ? 4 : agent.deskDir === 'left' ? 40 : 22,
                  transition: 'top 0.2s ease',
                  zIndex: 10,
                }}>
                  <PixelCharacter color={agent.color} working={isWorking} size={0.9} />
                </div>

                {/* Status bubble */}
                <div style={{
                  position: 'absolute',
                  top: -28,
                  left: -10,
                  backgroundColor: '#111',
                  border: `1px solid ${isWorking ? agent.color : '#2A2A2A'}`,
                  borderRadius: '4px',
                  padding: '3px 7px',
                  whiteSpace: 'nowrap',
                  fontSize: '9px',
                  color: isWorking ? agent.color : '#555',
                  fontFamily: 'monospace',
                  zIndex: 20,
                  maxWidth: '130px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {isWorking ? (tick % 3 === 0 ? '▋ ' : tick % 3 === 1 ? '▊ ' : '█ ') : ''}
                  {isWorking && state.task ? state.task.slice(0, 18) + (state.task.length > 18 ? '…' : '') : agent.description}
                </div>

                {/* Name label */}
                <div style={{
                  position: 'absolute',
                  top: 92,
                  left: -4,
                  fontSize: '9px',
                  color: agent.color,
                  fontFamily: 'monospace',
                  fontWeight: '700',
                  whiteSpace: 'nowrap',
                }}>
                  {agent.emoji} {agent.name}
                </div>

                {/* Working glow */}
                {isWorking && (
                  <div style={{
                    position: 'absolute',
                    top: -4, left: -4, right: -4, bottom: -4,
                    border: `1px solid ${agent.color}44`,
                    borderRadius: '6px',
                    pointerEvents: 'none',
                    animation: 'glow 2s ease-in-out infinite',
                  }} />
                )}
              </div>
            )
          })}

          {/* Meeting table in center */}
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            <div style={{ width: 90, height: 60, backgroundColor: '#5C3D11', border: '2px solid #3a2800', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ color: '#8B6914', fontSize: '9px', textAlign: 'center', fontFamily: 'monospace', lineHeight: '1.6' }}>
                VI<br/>HQ
              </div>
            </div>
            {/* Chairs around table */}
            {[
              { top: -14, left: 12 }, { top: -14, left: 54 },
              { top: 60, left: 12 }, { top: 60, left: 54 },
              { top: 20, left: -12 }, { top: 20, left: 90 },
            ].map((pos, i) => (
              <div key={i} style={{ position: 'absolute', ...pos, width: 16, height: 12, backgroundColor: '#4a3000', border: '1px solid #3a2800', borderRadius: '2px' }} />
            ))}
          </div>
        </div>

        {/* CSS animations */}
        <style>{`
          @keyframes typing {
            from { transform: translateY(0px); }
            to { transform: translateY(-4px); }
          }
          @keyframes glow {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}</style>
      </div>

      {/* Live activity feed */}
      <div style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '8px', padding: '16px', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#4CAF50', animation: 'pulse 2s infinite' }} />
            Live Feed
          </div>
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data?.recentActivity?.length === 0 && (
              <div style={{ color: '#555', fontSize: '12px', textAlign: 'center', marginTop: '24px' }}>No activity yet.</div>
            )}
            {data?.recentActivity?.map((entry: any, i: number) => {
              const agent = AGENTS.find(a => a.id === entry.actor)
              const color = agent?.color || (entry.actor === 'sameer' ? '#4A90D9' : '#737373')
              const diff = Date.now() - new Date(entry.ts).getTime()
              const mins = Math.floor(diff / 60000)
              const timeStr = mins < 1 ? 'just now' : mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`
              return (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '14px', flexShrink: 0 }}>{agent?.emoji || '👤'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ color, fontSize: '11px', fontWeight: '600' }}>{entry.actor === 'sameer' ? 'Sameer' : agent?.name || entry.actor}</span>
                    <span style={{ color: '#aaa', fontSize: '11px' }}> {entry.action}</span>
                    {entry.taskTitle && <div style={{ color: '#555', fontSize: '10px', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>&quot;{entry.taskTitle}&quot;</div>}
                    <div style={{ color: '#444', fontSize: '10px' }}>{timeStr}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '8px', padding: '12px' }}>
          <div style={{ color: '#555', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Legend</div>
          {[
            { color: '#4CAF50', label: 'Working / Active' },
            { color: '#737373', label: 'Idle / Standby' },
            { color: '#C9A84C', label: 'Jarvis (you)' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color }} />
              <span style={{ color: '#737373', fontSize: '11px' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
