'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, CalendarDays, FolderKanban, Brain, FileText, Users, Building2, MessageSquare, TrendingUp, GitMerge } from 'lucide-react'

const navItems = [
  { icon: LayoutGrid, href: '/task-board', label: 'Task Board' },
  { icon: MessageSquare, href: '/inbox', label: 'Inbox' },
  { icon: CalendarDays, href: '/calendar', label: 'Calendar' },
  { icon: FolderKanban, href: '/projects', label: 'Projects' },
  { icon: Brain, href: '/memories', label: 'Memories' },
  { icon: FileText, href: '/docs', label: 'Docs' },
  { icon: Users, href: '/team', label: 'Team' },
  { icon: Building2, href: '/office', label: 'Office' },
  { icon: TrendingUp, href: '/marketing', label: 'Marketing' },
  { icon: GitMerge, href: '/pipeline', label: 'Pipeline' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div
      style={{
        width: '240px',
        minWidth: '240px',
        background: '#0F0F0F',
        borderRight: '1px solid #2A2A2A',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '16px' }}>
        <span style={{ fontWeight: 'bold', color: 'white', fontSize: '13px', letterSpacing: '0.02em' }}>
          ⚡ Mission Control
        </span>
      </div>
      <div style={{ height: '1px', background: '#2A2A2A', margin: '0' }} />
      <nav style={{ flex: 1, paddingTop: '8px' }}>
        {navItems.map(({ icon: Icon, href, label }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              style={{ textDecoration: 'none', display: 'block', margin: '2px 8px' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  color: isActive ? 'white' : '#737373',
                  background: isActive ? '#1C1C1C' : 'transparent',
                  borderLeft: isActive ? '2px solid #C9A84C' : '2px solid transparent',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.background = '#1A1A1A'
                    el.style.color = 'white'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.background = 'transparent'
                    el.style.color = '#737373'
                  }
                }}
              >
                <Icon size={16} />
                <span>{label}</span>
              </div>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
