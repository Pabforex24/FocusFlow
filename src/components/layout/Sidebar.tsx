'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Globe,
  Target,
  CheckSquare,
  Sparkles,
  Flame,
  Zap,
  Trophy,
  BarChart2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'

const NAV_ITEMS = [
  { href: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/domains',     label: 'Domaines',    icon: Globe           },
  { href: '/goals',       label: 'Objectifs',   icon: Target          },
  { href: '/tasks',       label: 'Tâches',      icon: CheckSquare     },
  { href: '/challenges',  label: 'Challenges',  icon: Trophy          },
  { href: '/progression', label: 'Progression', icon: BarChart2       },
  { href: '/coach',       label: 'IA Coach',    icon: Sparkles        },
]

export function Sidebar() {
  const pathname = usePathname()
  const { streak, tasks, userStats } = useStore()

  const today = new Date().toDateString()
  const pendingToday = tasks.filter(
    (t) => !t.done && new Date(t.scheduledAt).toDateString() === today
  ).length

  return (
    <>
      {/* ── Desktop sidebar ────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 min-w-[224px] h-screen sticky top-0 bg-bg-2 border-r border-border z-40">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-heading font-extrabold text-base tracking-tight">
            Focus<span className="text-accent">Flow</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          <p className="text-[10px] font-bold tracking-widest uppercase text-content-3 px-2 mb-2 mt-1">
            Principal
          </p>
          {NAV_ITEMS.slice(0, 6).map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              active={pathname.startsWith(item.href)}
              icon={<item.icon size={16} />}
              badge={item.href === '/tasks' && pendingToday > 0 ? pendingToday : undefined}
            >
              {item.label}
            </NavLink>
          ))}

          <p className="text-[10px] font-bold tracking-widest uppercase text-content-3 px-2 mb-2 mt-4">
            Intelligence
          </p>
          {NAV_ITEMS.slice(6).map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              active={pathname.startsWith(item.href)}
              icon={<item.icon size={16} />}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Streak + XP footer */}
        <div className="p-3 border-t border-border space-y-2">
          {/* XP mini bar */}
          <div className="flex items-center gap-2 px-1">
            <div className="flex items-center gap-1 text-[10px] font-bold" style={{ color: '#7B61FF' }}>
              <Zap size={11} fill="currentColor" />
              <span>Nv.{userStats.level}</span>
            </div>
            <div className="flex-1 h-1 bg-bg-4 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, Math.round(((userStats.xpToNextLevel) / (userStats.level * 100 + 50)) * 100))}%`,
                  background: 'linear-gradient(90deg, #7B61FF, #A259FF)',
                }}
              />
            </div>
          </div>
          {/* Streak */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-warning/10 to-danger/5 border border-warning/20 rounded-xl px-3 py-2.5">
            <Flame size={20} className="text-warning flex-shrink-0" />
            <div>
              <div className="font-heading font-extrabold text-warning text-xl leading-none">{streak}</div>
              <div className="text-[10px] text-content-3 mt-0.5">jours de suite</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom nav ──────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-2/95 backdrop-blur border-t border-border z-40 flex items-center px-1 py-1">
        {[NAV_ITEMS[0], NAV_ITEMS[3], NAV_ITEMS[4], NAV_ITEMS[5], NAV_ITEMS[6]].map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all duration-150 relative',
                active ? 'text-accent' : 'text-content-3'
              )}
            >
              <item.icon size={18} />
              <span className="text-[9px] font-medium truncate">{item.label}</span>
              {item.href === '/tasks' && pendingToday > 0 && (
                <span className="absolute top-1.5 right-[20%] w-4 h-4 bg-accent text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {pendingToday}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </>
  )
}

// ── NavLink sub-component ─────────────────────────────────────────────────────
function NavLink({
  href,
  active,
  icon,
  badge,
  children,
}: {
  href: string
  active: boolean
  icon: React.ReactNode
  badge?: number
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 relative',
        active
          ? 'bg-accent/15 text-accent'
          : 'text-content-2 hover:bg-bg-3 hover:text-content'
      )}
    >
      <span className={cn('transition-opacity', active ? 'opacity-100' : 'opacity-60')}>
        {icon}
      </span>
      {children}
      {badge !== undefined && (
        <span className="ml-auto bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
          {badge}
        </span>
      )}
    </Link>
  )
}
