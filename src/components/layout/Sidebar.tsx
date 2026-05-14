'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Globe, Target, CheckSquare,
  Flame, Zap, Trophy, Timer,
  User, LogOut, ChevronLeft, ChevronRight, Plus, X, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'
import * as db from '@/lib/db'
import { NotificationPanel } from '@/components/NotificationPanel'

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/domains',    label: 'Domaines',   icon: Globe           },
  { href: '/goals',      label: 'Objectifs',  icon: Target          },
  { href: '/tasks',      label: 'Taches',     icon: CheckSquare     },
  { href: '/challenges', label: 'Challenges', icon: Trophy          },
]

const MOBILE_LEFT  = [NAV_ITEMS[0], NAV_ITEMS[3]]           // Dashboard, Taches
const MOBILE_RIGHT = [NAV_ITEMS[4], NAV_ITEMS[1], NAV_ITEMS[2]] // Challenges, Domaines, Objectifs

export function Sidebar({ onOpenFocus }: { onOpenFocus?: () => void }) {
  const pathname = usePathname()
  const router   = useRouter()
  const { streak, tasks, userStats, focusSession, setSupabaseUser } = useStore()

  const [collapsed, setCollapsed] = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isFocusActive  = focusSession?.status === 'running' || focusSession?.status === 'paused'
  const isFocusRunning = focusSession?.status === 'running'
  const elapsed   = focusSession?.elapsedSeconds ?? 0
  const total     = (focusSession?.durationMinutes ?? 25) * 60
  const remaining = Math.max(0, total - elapsed)
  const fMM = String(Math.floor(remaining / 60)).padStart(2, '0')
  const fSS = String(remaining % 60).padStart(2, '0')

  const today        = new Date().toDateString()
  const pendingToday = tasks.filter((t) => !t.done && new Date(t.scheduledAt).toDateString() === today).length
  const xpMax  = userStats.level * 100 + 50
  const xpPct  = Math.min(100, Math.round(((xpMax - userStats.xpToNextLevel) / xpMax) * 100))

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleSignOut = async () => {
    setMenuOpen(false)
    await db.signOut()
    setSupabaseUser(null)
    router.push('/auth/login')
  }

  // Draggable coach button
  const [coachPos, setCoachPos] = useState({ right: 16, bottom: 80 })
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, initRight: 16, initBottom: 80 })

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]
    dragRef.current = { dragging: true, startX: t.clientX, startY: t.clientY, initRight: coachPos.right, initBottom: coachPos.bottom }
  }, [coachPos])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragRef.current.dragging) return
    e.preventDefault()
    const t = e.touches[0]
    const dx = t.clientX - dragRef.current.startX
    const dy = t.clientY - dragRef.current.startY
    setCoachPos({
      right:  Math.max(8, Math.min(window.innerWidth - 64, dragRef.current.initRight - dx)),
      bottom: Math.max(80, dragRef.current.initBottom - dy),
    })
  }, [])

  const onTouchEnd = useCallback(() => { dragRef.current.dragging = false }, [])

  const quickActions = [
    { label: 'Nouveau challenge', icon: Trophy,  href: '/challenges', color: '#C8865A' },
    { label: 'Nouvel objectif',   icon: Target,  href: '/goals',      color: '#3DD8FA' },
    { label: 'Nouveau domaine',   icon: Globe,   href: '/domains',    color: '#00E5B0' },
  ]

  return (
    <>
      {/* MOBILE HEADER */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 8px)',
          paddingBottom: '10px',
          background: 'rgba(5,8,18,0.94)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#00E5B0,#3DD8FA)', boxShadow: '0 0 12px rgba(0,229,176,0.35)' }}>
            <Zap size={13} strokeWidth={2.5} style={{ color: '#050812' }} />
          </div>
          <span className="font-heading font-extrabold text-sm tracking-tight text-content">
            Focus<span style={{ color: '#00E5B0' }}>Flow</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isFocusActive && (
            <button onClick={onOpenFocus}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold"
              style={{
                background: isFocusRunning ? 'rgba(0,229,176,0.12)' : 'rgba(123,94,167,0.12)',
                border: `1px solid ${isFocusRunning ? 'rgba(0,229,176,0.30)' : 'rgba(123,94,167,0.28)'}`,
                color: isFocusRunning ? '#00E5B0' : '#7B5EA7',
              }}>
              <Timer size={11} strokeWidth={1.75} />
              <span className="font-mono">{fMM}:{fSS}</span>
            </button>
          )}
          <NotificationPanel />
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
              <div className="absolute right-0 top-10 w-44 rounded-2xl overflow-hidden z-50"
                style={{ background: 'rgba(14,18,36,0.98)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 16px 48px rgba(0,0,0,0.65)' }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-xs font-bold text-content">Mon compte</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#3D4F6E' }}>Nv.{userStats.level} · {userStats.xp} XP</p>
                </div>
                <button onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium hover:bg-white/5 transition-all"
                  style={{ color: '#FF5E7A' }}>
                  <LogOut size={13} /> Deconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col h-screen sticky top-0 z-40 transition-all duration-300"
        style={{
          width: collapsed ? '64px' : '220px',
          minWidth: collapsed ? '64px' : '220px',
          background: 'rgba(7,10,20,0.98)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.055)',
        }}>

        {/* Logo + collapse */}
        <div className="flex items-center px-3 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', minHeight: '60px' }}>
          {!collapsed ? (
            <>
              <div className="flex items-center gap-2.5 flex-1 overflow-hidden">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#00E5B0,#3DD8FA)', boxShadow: '0 0 10px rgba(0,229,176,0.35)' }}>
                  <Zap size={13} strokeWidth={2.5} style={{ color: '#050812' }} />
                </div>
                <span className="font-heading font-extrabold text-sm text-content whitespace-nowrap">
                  Focus<span style={{ color: '#00E5B0' }}>Flow</span>
                </span>
              </div>
              <button onClick={() => setCollapsed(true)}
                className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 hover:bg-white/10 transition-all"
                style={{ color: '#3D4F6E' }}>
                <ChevronLeft size={14} />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center w-full gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#00E5B0,#3DD8FA)' }}>
                <Zap size={13} strokeWidth={2.5} style={{ color: '#050812' }} />
              </div>
              <button onClick={() => setCollapsed(false)}
                className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all"
                style={{ color: '#3D4F6E' }}>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn('flex items-center rounded-xl transition-all relative group',
                  collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2')}
                style={{ color: active ? '#00E5B0' : '#7A8BAD', background: active ? 'rgba(0,229,176,0.08)' : 'transparent' }}>
                {active && !collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full" style={{ background: '#00E5B0' }} />
                )}
                <item.icon size={16} strokeWidth={active ? 2 : 1.75} className="flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
                {item.href === '/tasks' && pendingToday > 0 && (
                  collapsed
                    ? <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full" style={{ background: '#00E5B0' }} />
                    : <span className="ml-auto w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: '#00E5B0', color: '#050812' }}>{pendingToday}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 space-y-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {/* XP */}
          {!collapsed && (
            <div className="px-2 py-1.5 rounded-xl" style={{ background: 'rgba(0,229,176,0.04)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: '#00E5B0' }}>
                  <Zap size={10} fill="currentColor" strokeWidth={0} /> Nv.{userStats.level}
                </span>
                <span className="text-[9px]" style={{ color: '#3D4F6E' }}>{userStats.xp} XP</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full" style={{ width: `${xpPct}%`, background: 'linear-gradient(90deg,#00E5B0,#3DD8FA)', transition: 'width 0.7s ease' }} />
              </div>
            </div>
          )}

          {/* Streak */}
          <div className={cn('flex items-center rounded-xl', collapsed ? 'justify-center p-2.5' : 'gap-2 px-3 py-2')}
            style={{ background: 'rgba(200,134,90,0.07)', border: '1px solid rgba(200,134,90,0.13)' }}
            title={collapsed ? `Streak: ${streak} jours` : undefined}>
            <Flame size={14} style={{ color: '#C8865A' }} strokeWidth={1.75} className="flex-shrink-0" />
            {!collapsed && (
              <span className="text-sm font-bold" style={{ color: '#C8865A' }}>{streak}
                <span className="text-[10px] font-normal ml-1" style={{ color: '#3D4F6E' }}>j de suite</span>
              </span>
            )}
          </div>

          {/* Focus */}
          <button onClick={onOpenFocus}
            className={cn('w-full flex items-center rounded-xl transition-all', collapsed ? 'justify-center p-2.5' : 'gap-2 px-3 py-2')}
            title={collapsed ? 'Mode Focus' : undefined}
            style={isFocusActive ? {
              background: isFocusRunning ? 'rgba(0,229,176,0.09)' : 'rgba(123,94,167,0.09)',
              border: isFocusRunning ? '1px solid rgba(0,229,176,0.22)' : '1px solid rgba(123,94,167,0.22)',
              color: isFocusRunning ? '#00E5B0' : '#7B5EA7',
            } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#7A8BAD' }}>
            <Timer size={14} strokeWidth={1.75} className="flex-shrink-0" />
            {!collapsed && (
              isFocusActive
                ? <span className="font-mono font-bold text-sm">{fMM}:{fSS}</span>
                : <span className="text-sm font-medium">Focus</span>
            )}
          </button>

          {/* Coach */}
          <Link href="/coach"
            className={cn('flex items-center rounded-xl transition-all', collapsed ? 'justify-center p-2.5' : 'gap-2 px-3 py-2')}
            title={collapsed ? 'IA Coach' : undefined}
            style={{ background: 'rgba(61,216,250,0.05)', border: '1px solid rgba(61,216,250,0.12)', color: '#3DD8FA' }}>
            <Sparkles size={14} strokeWidth={1.75} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">IA Coach</span>}
          </Link>

          {/* Account */}
          <div ref={menuRef} className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)}
              className={cn('w-full flex items-center rounded-xl transition-all hover:bg-white/5', collapsed ? 'justify-center p-2.5' : 'gap-2 px-3 py-2')}
              title={collapsed ? 'Mon compte' : undefined}
              style={{ color: '#7A8BAD', border: '1px solid rgba(255,255,255,0.06)' }}>
              <User size={14} strokeWidth={1.75} className="flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">Compte</span>}
            </button>
            {menuOpen && (
              <div className={cn('absolute rounded-2xl overflow-hidden z-50', collapsed ? 'left-16 bottom-0' : 'bottom-10 left-0 right-0')}
                style={{ width: collapsed ? '180px' : undefined, background: 'rgba(14,18,36,0.98)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 -8px 32px rgba(0,0,0,0.65)' }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-xs font-bold text-content">Mon compte</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#3D4F6E' }}>Nv.{userStats.level} · {userStats.xp} XP</p>
                </div>
                <button onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium hover:bg-white/5 transition-all"
                  style={{ color: '#FF5E7A' }}>
                  <LogOut size={13} /> Deconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* MOBILE COACH DRAGGABLE */}
      <Link href="/coach"
        className="md:hidden fixed z-50 flex items-center justify-center rounded-2xl"
        style={{
          right: `${coachPos.right}px`,
          bottom: `${coachPos.bottom}px`,
          width: '48px', height: '48px',
          background: 'linear-gradient(135deg,rgba(61,216,250,0.18),rgba(123,94,167,0.18))',
          border: '1px solid rgba(61,216,250,0.28)',
          boxShadow: '0 4px 20px rgba(61,216,250,0.18)',
          backdropFilter: 'blur(12px)',
          touchAction: 'none',
        }}
        onTouchStart={onTouchStart as any}
        onTouchMove={onTouchMove as any}
        onTouchEnd={onTouchEnd}
      >
        <Sparkles size={20} strokeWidth={1.75} style={{ color: '#3DD8FA' }} />
      </Link>

      {/* QUICK ACTIONS */}
      {quickOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setQuickOpen(false)} />
          <div className="md:hidden fixed z-50 flex flex-col items-stretch gap-2.5"
            style={{ bottom: 'calc(env(safe-area-inset-bottom) + 80px)', left: '50%', transform: 'translateX(-50%)', width: '200px' }}>
            {quickActions.map((action, i) => (
              <Link key={action.href} href={action.href}
                onClick={() => setQuickOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm animate-scale-in"
                style={{
                  background: 'rgba(9,13,26,0.96)',
                  border: `1px solid ${action.color}30`,
                  color: action.color,
                  boxShadow: `0 4px 24px rgba(0,0,0,0.55)`,
                  backdropFilter: 'blur(12px)',
                  animationDelay: `${i * 40}ms`,
                }}>
                <action.icon size={16} strokeWidth={1.75} />
                {action.label}
              </Link>
            ))}
          </div>
        </>
      )}

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center mobile-nav"
        style={{
          background: 'rgba(5,8,18,0.94)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.055)',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.50)',
        }}>
        {MOBILE_LEFT.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all relative"
              style={{ color: active ? '#00E5B0' : '#3D4F6E' }}>
              {active && <span className="absolute inset-x-2 inset-y-0.5 rounded-xl" style={{ background: 'rgba(0,229,176,0.07)', border: '1px solid rgba(0,229,176,0.12)' }} />}
              <item.icon size={20} strokeWidth={active ? 2 : 1.75} className="relative" />
              <span className="text-[10px] font-semibold relative truncate px-1">{item.label}</span>
              {item.href === '/tasks' && pendingToday > 0 && (
                <span className="absolute top-1 right-[16%] w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center"
                  style={{ background: '#00E5B0', color: '#050812' }}>{pendingToday}</span>
              )}
            </Link>
          )
        })}

        {/* + Button */}
        <button onClick={() => setQuickOpen(!quickOpen)}
          className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center -mt-4 transition-all active:scale-95"
          style={{
            background: quickOpen ? 'linear-gradient(135deg,#FF5E7A,#C8865A)' : 'linear-gradient(135deg,#00E5B0,#3DD8FA)',
            boxShadow: quickOpen ? '0 4px 20px rgba(255,94,122,0.40)' : '0 4px 20px rgba(0,229,176,0.40)',
          }}>
          {quickOpen
            ? <X size={19} strokeWidth={2.5} style={{ color: '#fff' }} />
            : <Plus size={19} strokeWidth={2.5} style={{ color: '#050812' }} />}
        </button>

        {MOBILE_RIGHT.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all relative"
              style={{ color: active ? '#00E5B0' : '#3D4F6E' }}>
              {active && <span className="absolute inset-x-2 inset-y-0.5 rounded-xl" style={{ background: 'rgba(0,229,176,0.07)', border: '1px solid rgba(0,229,176,0.12)' }} />}
              <item.icon size={20} strokeWidth={active ? 2 : 1.75} className="relative" />
              <span className="text-[10px] font-semibold relative truncate px-1">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
