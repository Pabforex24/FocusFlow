'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Globe, Target, CheckSquare,
  Sparkles, Flame, Zap, Trophy, Timer,
  Bell, User, LogOut, ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'
import * as db from '@/lib/db'

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/domains',    label: 'Domaines',   icon: Globe           },
  { href: '/goals',      label: 'Objectifs',  icon: Target          },
  { href: '/tasks',      label: 'Tâches',     icon: CheckSquare     },
  { href: '/challenges', label: 'Challenges', icon: Trophy          },
  { href: '/coach',      label: 'IA Coach',   icon: Sparkles        },
]

// Mobile : Dashboard, Tâches, Domaines, Challenges, Objectifs
const MOBILE_NAV = [NAV_ITEMS[0], NAV_ITEMS[3], NAV_ITEMS[1], NAV_ITEMS[4], NAV_ITEMS[2]]

export function Sidebar({ onOpenFocus }: { onOpenFocus?: () => void }) {
  const pathname = usePathname()
  const router   = useRouter()
  const { streak, tasks, userStats, focusSession, setSupabaseUser } = useStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef  = useRef<HTMLDivElement>(null)
  const menuRef2 = useRef<HTMLDivElement>(null)

  const today        = new Date().toDateString()
  const pendingToday = tasks.filter((t) => !t.done && new Date(t.scheduledAt).toDateString() === today).length

  const xpMax     = userStats.level * 100 + 50
  const xpPct     = Math.min(100, Math.round(((xpMax - userStats.xpToNextLevel) / xpMax) * 100))

  const isFocusActive  = focusSession?.status === 'running' || focusSession?.status === 'paused'
  const isFocusRunning = focusSession?.status === 'running'
  const isFocusPaused  = focusSession?.status === 'paused'
  const focusElapsed   = focusSession?.elapsedSeconds ?? 0
  const focusTotal     = (focusSession?.durationMinutes ?? 25) * 60
  const focusRemaining = Math.max(0, focusTotal - focusElapsed)
  const focusMM = String(Math.floor(focusRemaining / 60)).padStart(2, '0')
  const focusSS = String(focusRemaining % 60).padStart(2, '0')

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        menuRef2.current && !menuRef2.current.contains(e.target as Node)
      ) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => {
    setMenuOpen(false)
    await db.signOut()
    setSupabaseUser(null)
    router.push('/auth/login')
  }

  return (
    <>
      {/* ══ MOBILE HEADER ══════════════════════════════════════════════ */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 8px)',
          paddingBottom: '10px',
          background: 'rgba(5,8,18,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.055)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.40)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#00E5B0,#3DD8FA)', boxShadow: '0 0 12px rgba(0,229,176,0.40)' }}>
            <Zap size={13} strokeWidth={2.5} style={{ color: '#050812' }} />
          </div>
          <span className="font-heading font-extrabold text-sm tracking-tight text-content">
            Focus<span style={{ color: '#00E5B0' }}>Flow</span>
          </span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Focus timer si actif */}
          {isFocusActive && (
            <button onClick={onOpenFocus}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold"
              style={{
                background: isFocusRunning ? 'rgba(0,229,176,0.12)' : 'rgba(123,94,167,0.12)',
                border: `1px solid ${isFocusRunning ? 'rgba(0,229,176,0.30)' : 'rgba(123,94,167,0.28)'}`,
                color: isFocusRunning ? '#00E5B0' : '#7B5EA7',
              }}>
              <Timer size={11} strokeWidth={1.75} />
              <span className="font-mono">{focusMM}:{focusSS}</span>
            </button>
          )}

          {/* Notification bell */}
          <Link href="/coach"
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Bell size={15} strokeWidth={1.75} style={{ color: '#7A8BAD' }} />
          </Link>

          {/* Account dropdown */}
          <div ref={menuRef} className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: menuOpen ? 'rgba(0,229,176,0.12)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${menuOpen ? 'rgba(0,229,176,0.25)' : 'rgba(255,255,255,0.07)'}`,
              }}>
              <User size={15} strokeWidth={1.75} style={{ color: menuOpen ? '#00E5B0' : '#7A8BAD' }} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-10 w-48 rounded-2xl overflow-hidden z-50 animate-scale-in"
                style={{ background: 'rgba(14,18,36,0.98)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 16px 48px rgba(0,0,0,0.60)' }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="text-xs font-semibold text-content">Mon compte</div>
                  <div className="text-[10px] mt-0.5" style={{ color: '#3D4F6E' }}>Nv.{userStats.level} · {userStats.xp} XP</div>
                </div>
                <Link href="/coach" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium hover:bg-white/5 transition-all"
                  style={{ color: '#E8EDF7' }}>
                  <Bell size={13} style={{ color: '#7A8BAD' }} /> Notifications
                </Link>
                <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                <button onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium hover:bg-white/5 transition-all"
                  style={{ color: '#FF5E7A' }}>
                  <LogOut size={13} /> Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ══ DESKTOP SIDEBAR ════════════════════════════════════════════ */}
      <aside className="hidden md:flex flex-col w-56 min-w-[224px] h-screen sticky top-0 z-40"
        style={{
          background: 'linear-gradient(180deg,rgba(9,13,26,0.97),rgba(5,8,18,0.98))',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.055)',
          boxShadow: '4px 0 40px rgba(0,0,0,0.40)',
        }}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#00E5B0,#3DD8FA)', boxShadow: '0 0 16px rgba(0,229,176,0.40)' }}>
            <Zap size={15} strokeWidth={2.5} style={{ color: '#050812' }} />
          </div>
          <span className="font-heading font-extrabold text-base tracking-tight text-content">
            Focus<span style={{ color: '#00E5B0' }}>Flow</span>
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          <p className="text-[9px] font-bold tracking-[0.18em] uppercase text-content-4 px-3 mb-2 mt-1">Principal</p>
          {NAV_ITEMS.slice(0, 5).map((item) => (
            <NavLink key={item.href} href={item.href} active={pathname.startsWith(item.href)}
              icon={<item.icon size={15} strokeWidth={1.75} />}
              badge={item.href === '/tasks' && pendingToday > 0 ? pendingToday : undefined}>
              {item.label}
            </NavLink>
          ))}
          <p className="text-[9px] font-bold tracking-[0.18em] uppercase text-content-4 px-3 mb-2 mt-5">Intelligence</p>
          {NAV_ITEMS.slice(5).map((item) => (
            <NavLink key={item.href} href={item.href} active={pathname.startsWith(item.href)}
              icon={<item.icon size={15} strokeWidth={1.75} />}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 space-y-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {/* XP bar */}
          <div className="px-1">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: '#00E5B0' }}>
                <Zap size={11} fill="currentColor" strokeWidth={0} />Nv.{userStats.level}
              </div>
              <span className="text-[9px]" style={{ color: '#3D4F6E' }}>{xpPct}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${xpPct}%`, background: 'linear-gradient(90deg,#00E5B0,#3DD8FA)', boxShadow: '0 0 8px rgba(0,229,176,0.5)' }} />
            </div>
          </div>

          {/* Streak */}
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5"
            style={{ background: 'linear-gradient(135deg,rgba(200,134,90,0.10),rgba(9,13,26,0.60))', border: '1px solid rgba(200,134,90,0.18)' }}>
            <Flame size={18} style={{ color: '#C8865A' }} strokeWidth={1.75} className="flex-shrink-0" />
            <div>
              <div className="font-heading font-extrabold text-xl leading-none" style={{ color: '#C8865A' }}>{streak}</div>
              <div className="text-[9px] mt-0.5" style={{ color: '#3D4F6E' }}>jours de suite</div>
            </div>
          </div>

          {/* Account dropdown desktop */}
          <div ref={menuRef2} className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:bg-white/5"
              style={{ color: '#7A8BAD', border: '1px solid rgba(255,255,255,0.06)' }}>
              <User size={13} /><span>Mon compte</span>
              <ChevronDown size={11} className={cn('ml-auto transition-transform', menuOpen && 'rotate-180')} />
            </button>
            {menuOpen && (
              <div className="absolute bottom-11 left-0 right-0 rounded-2xl overflow-hidden z-50 animate-scale-in"
                style={{ background: 'rgba(14,18,36,0.98)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 -8px 32px rgba(0,0,0,0.60)' }}>
                <Link href="/coach" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium hover:bg-white/5 transition-all"
                  style={{ color: '#E8EDF7' }}>
                  <Bell size={13} style={{ color: '#7A8BAD' }} /> Notifications
                </Link>
                <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                <button onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium hover:bg-white/5 transition-all"
                  style={{ color: '#FF5E7A' }}>
                  <LogOut size={13} /> Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Focus button */}
        <div className="p-3 pt-0">
          <button onClick={onOpenFocus}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={isFocusActive ? {
              background: isFocusRunning ? 'rgba(0,229,176,0.12)' : 'rgba(123,94,167,0.12)',
              border: isFocusRunning ? '1px solid rgba(0,229,176,0.28)' : '1px solid rgba(123,94,167,0.28)',
              color: isFocusRunning ? '#00E5B0' : '#7B5EA7',
            } : { background: 'rgba(123,94,167,0.07)', border: '1px solid rgba(123,94,167,0.16)', color: '#7B5EA7' }}>
            <Timer size={14} strokeWidth={1.75} className="flex-shrink-0" />
            {isFocusActive
              ? <span className="font-mono font-extrabold tracking-wider">{focusMM}:{focusSS}</span>
              : <span>Mode Focus</span>}
            {isFocusPaused && <span className="ml-auto text-[9px] opacity-60">En pause</span>}
          </button>
        </div>
      </aside>

      {/* ══ MOBILE BOTTOM NAV ══════════════════════════════════════════ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center px-1 pt-1 mobile-nav"
        style={{
          background: 'rgba(5,8,18,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.055)',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.50)',
        }}>
        {MOBILE_NAV.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all duration-150 relative"
              style={{ color: active ? '#00E5B0' : '#3D4F6E' }}>
              {active && (
                <span className="absolute inset-x-2 inset-y-0.5 rounded-xl"
                  style={{ background: 'rgba(0,229,176,0.07)', border: '1px solid rgba(0,229,176,0.12)' }} />
              )}
              <item.icon size={20} strokeWidth={active ? 2 : 1.75} className="relative" />
              <span className="text-[10px] font-semibold tracking-wide relative truncate max-w-full px-1">{item.label}</span>
              {item.href === '/tasks' && pendingToday > 0 && (
                <span className="absolute top-1 right-[18%] w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center"
                  style={{ background: '#00E5B0', color: '#050812', boxShadow: '0 0 8px rgba(0,229,176,0.5)' }}>
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

function NavLink({ href, active, icon, badge, children }: {
  href: string; active: boolean; icon: React.ReactNode; badge?: number; children: React.ReactNode
}) {
  return (
    <Link href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 relative group"
      style={{ color: active ? '#00E5B0' : '#7A8BAD', background: active ? 'rgba(0,229,176,0.07)' : 'transparent' }}>
      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full" style={{ background: '#00E5B0' }} />}
      <span className={cn('flex-shrink-0 transition-opacity', active ? 'opacity-100' : 'opacity-60 group-hover:opacity-100')}>{icon}</span>
      <span className="flex-1 truncate">{children}</span>
      {badge !== undefined && (
        <span className="w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: '#00E5B0', color: '#050812' }}>
          {badge}
        </span>
      )}
    </Link>
  )
}
