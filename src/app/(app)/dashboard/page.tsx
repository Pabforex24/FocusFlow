'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Flame, Zap, TrendingUp, Timer, ArrowRight,
  CheckCircle2, Target, ListTodo, Trophy, Sparkles,
} from 'lucide-react'
import { useStore } from '@/store'
import { getGreeting, hexToRgba } from '@/lib/utils'
import { ProgressBar, RingProgress } from '@/components/ui/ProgressBar'
import { DomainIcon } from '@/components/domain/DomainIcon'
import { XPBar } from '@/components/gamification/XPBar'
import { Onboarding } from '@/components/onboarding/Onboarding'
import { format, subDays, isSameDay, eachDayOfInterval, startOfWeek } from 'date-fns'
import { fr } from 'date-fns/locale'

function getCompletionRate(tasks: ReturnType<typeof useStore.getState>['tasks'], date: Date) {
  const day = tasks.filter((t) => isSameDay(new Date(t.scheduledAt), date))
  if (!day.length) return null
  return Math.round((day.filter((t) => t.done).length / day.length) * 100)
}
function heatColor(rate: number | null) {
  if (rate === null) return 'rgba(255,255,255,0.04)'
  if (rate === 0)    return 'rgba(255,94,122,0.25)'
  if (rate < 50)     return 'rgba(200,134,90,0.35)'
  if (rate < 80)     return 'rgba(61,216,250,0.35)'
  return 'rgba(0,229,176,0.55)'
}
function heatBorder(rate: number | null) {
  if (rate === null) return 'rgba(255,255,255,0.04)'
  if (rate === 0)    return 'rgba(255,94,122,0.40)'
  if (rate < 50)     return 'rgba(200,134,90,0.50)'
  if (rate < 80)     return 'rgba(61,216,250,0.50)'
  return 'rgba(0,229,176,0.70)'
}

export default function DashboardPage() {
  const {
    domains, goals, tasks, streak, userStats, focusSession,
    activeChallenges, badges,
    getDomainProgress, getGlobalProgress, getGoalProgress,
    updateStreak, applyDailyPenalty,
    onboarding,
  } = useStore()

  const openFocusModal = useStore((s) => s.openFocusModal)
  const [hoveredDay, setHoveredDay] = useState<{ date: Date; rate: number | null } | null>(null)

  useEffect(() => {
    updateStreak()
    applyDailyPenalty()
  }, [])

  const today    = useMemo(() => new Date(), [])
  const todayStr = today.toDateString()

  const todayTasks  = tasks.filter((t) => new Date(t.scheduledAt).toDateString() === todayStr)
  const doneTasks   = todayTasks.filter((t) => t.done)
  const todayPct    = todayTasks.length ? Math.round((doneTasks.length / todayTasks.length) * 100) : 0
  const globalPct   = getGlobalProgress()
  const hasFocus    = focusSession?.status === 'running' || focusSession?.status === 'paused'
  const activeCount = activeChallenges?.filter((c) => c.isActive).length ?? 0
  const totalDone   = tasks.filter((t) => t.done).length

  const last7 = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d     = subDays(today, 6 - i)
    const rate  = getCompletionRate(tasks, d)
    const done  = tasks.filter((t) => isSameDay(new Date(t.scheduledAt), d) && t.done).length
    const total = tasks.filter((t) => isSameDay(new Date(t.scheduledAt), d)).length
    return { date: d, rate, done, total }
  }), [tasks, today])

  const avg7  = Math.round(last7.filter((d) => d.rate !== null).reduce((a, d) => a + (d.rate ?? 0), 0) / Math.max(1, last7.filter((d) => d.rate !== null).length))
  const best7 = Math.max(0, ...last7.map((d) => d.rate ?? 0))

  const heatDays = useMemo(() => eachDayOfInterval({
    start: startOfWeek(subDays(today, 111), { weekStartsOn: 1 }),
    end:   today,
  }), [today])

  const weeks = useMemo(() => {
    const result: Date[][] = []
    let week: Date[] = []
    heatDays.forEach((d, i) => {
      week.push(d)
      if (week.length === 7 || i === heatDays.length - 1) { result.push(week); week = [] }
    })
    return result
  }, [heatDays])

  const domainStats = useMemo(() => domains.map((domain) => {
    const pct          = getDomainProgress(domain.id)
    const domGoals     = goals.filter((g) => g.domainId === domain.id)
    const domTasks     = tasks.filter((t) => t.domainId === domain.id)
    const completedGoals = domGoals.filter((g) => {
      const gt = tasks.filter((t) => t.goalId === g.id)
      return gt.length > 0 && gt.every((t) => t.done)
    })
    const todayDom     = domTasks.filter((t) => new Date(t.scheduledAt).toDateString() === todayStr)
    const doneTodayDom = todayDom.filter((t) => t.done)
    return { domain, pct, goalCount: domGoals.length, completedGoals: completedGoals.length, todayDom, doneTodayDom }
  }).sort((a, b) => b.pct - a.pct), [domains, goals, tasks, getDomainProgress, todayStr])

  if (!onboarding.completed) return <Onboarding />

  const cs = (color: string) => ({
    background: `linear-gradient(145deg, rgba(14,18,36,0.95) 0%, rgba(9,13,26,0.98) 100%)`,
    border: `1px solid ${hexToRgba(color, 0.18)}`,
    boxShadow: `0 4px 24px rgba(0,0,0,0.45)`,
  })

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto page-enter pb-24 md:pb-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl tracking-tight">
            {getGreeting()} 👋
          </h1>
          <p className="text-sm mt-0.5 capitalize" style={{ color: '#3D4F6E' }}>
            {format(today, 'EEEE d MMMM', { locale: fr })}
          </p>
        </div>
        <button
          onClick={() => openFocusModal()}
          className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all mt-1"
          style={{
            background:  hasFocus ? 'rgba(0,229,176,0.12)' : 'rgba(123,94,167,0.10)',
            borderColor: hasFocus ? 'rgba(0,229,176,0.30)' : 'rgba(123,94,167,0.28)',
            color:       hasFocus ? '#00E5B0' : '#7B5EA7',
          }}
        >
          <Timer size={13} strokeWidth={1.75} />
          {hasFocus ? 'Focus actif' : 'Focus'}
        </button>
      </div>

      {/* XP Bar */}
      <XPBar compact />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {([
          { label: "Aujourd'hui", value: `${doneTasks.length}/${todayTasks.length}`, sub: 'tâches',           icon: <CheckCircle2 size={15} />, color: '#00E5B0', href: '/tasks' },
          { label: 'Streak',      value: `${streak}j`,                               sub: `record: ${userStats.longestStreak}j`, icon: <Flame size={15} />, color: '#C8865A', href: null },
          { label: 'Niveau',      value: userStats.level,                            sub: `${userStats.xp} XP`, icon: <Zap size={15} />,          color: '#7B5EA7', href: null },
          { label: 'Global',      value: `${globalPct}%`,                           sub: 'progression',       icon: <TrendingUp size={15} />,   color: '#3DD8FA', href: '/goals' },
        ] as const).map((card) => {
          const inner = (
            <div className="rounded-2xl p-4 h-full" style={cs(card.color)}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-3"
                style={{ background: hexToRgba(card.color, 0.14), color: card.color }}>
                {card.icon}
              </div>
              <div className="font-heading font-extrabold text-xl leading-none mb-1" style={{ color: card.color }}>{card.value}</div>
              <div className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: '#3D4F6E' }}>{card.label}</div>
              <div className="text-[10px] mt-0.5" style={{ color: '#1E2A40' }}>{card.sub}</div>
            </div>
          )
          return card.href
            ? <Link key={card.label} href={card.href} className="block hover:scale-[1.02] transition-transform">{inner}</Link>
            : <div key={card.label}>{inner}</div>
        })}
      </div>

      {/* 7 derniers jours */}
      <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(145deg,rgba(14,18,36,.9),rgba(9,13,26,.95))', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading font-bold text-sm uppercase tracking-widest" style={{ color: '#7A8BAD' }}>7 derniers jours</h2>
            <p className="text-[10px] mt-0.5" style={{ color: '#1E2A40' }}>moy. {avg7}% · meilleur {best7}%</p>
          </div>
          <span className="font-heading font-extrabold text-xl" style={{ color: '#3DD8FA' }}>{avg7}%</span>
        </div>
        <div className="flex items-end gap-2 h-24">
          {last7.map(({ date, rate, done, total }, i) => {
            const h     = rate === null ? 8 : Math.max(8, (rate / 100) * 100)
            const color = rate === null ? '#1a2035' : rate >= 80 ? '#00E5B0' : rate >= 50 ? '#3DD8FA' : rate > 0 ? '#C8865A' : '#FF5E7A'
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                <div className="flex-1 w-full flex items-end">
                  <div className="w-full rounded-t-lg transition-all relative"
                    style={{ height: `${h}%`, background: rate === null ? 'rgba(255,255,255,0.04)' : `linear-gradient(to top,${hexToRgba(color,.6)},${hexToRgba(color,.9)})`, border: `1px solid ${hexToRgba(color,.25)}` }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap rounded-lg px-2 py-1 text-[9px] font-bold pointer-events-none z-10"
                      style={{ background: '#0e1224', border: `1px solid ${hexToRgba(color,.4)}`, color }}>
                      {rate === null ? 'Aucune' : `${done}/${total} · ${rate}%`}
                    </div>
                  </div>
                </div>
                <div className="text-[9px] font-semibold uppercase" style={{ color: isSameDay(date, today) ? '#00E5B0' : '#3D4F6E' }}>
                  {format(date, 'EEE', { locale: fr }).slice(0,3)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Domaines */}
      <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(145deg,rgba(14,18,36,.9),rgba(9,13,26,.95))', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading font-bold text-sm uppercase tracking-widest" style={{ color: '#7A8BAD' }}>Mes domaines</h2>
            <p className="text-[10px] mt-0.5" style={{ color: '#1E2A40' }}>{domains.length} domaine{domains.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-heading font-extrabold text-2xl leading-none" style={{ color: '#00E5B0' }}>{globalPct}%</div>
              <div className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: '#3D4F6E' }}>global</div>
            </div>
            <RingProgress value={globalPct} size={46} strokeWidth={4} color="#00E5B0">
              <TrendingUp size={12} color="#00E5B0" />
            </RingProgress>
          </div>
        </div>
        <ProgressBar value={globalPct} color="#00E5B0" height="sm" className="mb-5" />
        {domains.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: '#3D4F6E' }}>
            <Link href="/domains" className="hover:underline" style={{ color: '#00E5B0' }}>Créer un domaine →</Link>
          </p>
        ) : (
          <div className="space-y-2">
            {domainStats.map(({ domain, pct, goalCount, completedGoals, todayDom, doneTodayDom }) => {
              const sc = pct === 100 ? '#00E5B0' : pct >= 60 ? '#3DD8FA' : pct >= 30 ? '#C8865A' : '#FF5E7A'
              const sl = pct === 100 ? 'Complété' : pct >= 60 ? 'En bonne voie' : pct >= 30 ? 'En cours' : 'À relancer'
              return (
                <Link key={domain.id} href={`/goals?domain=${domain.id}`}
                  className="block group rounded-xl p-3.5 transition-all hover:scale-[1.01]"
                  style={{ background: `linear-gradient(135deg,${hexToRgba(domain.color,.06)},rgba(9,13,26,.6))`, border: `1px solid ${hexToRgba(domain.color,.14)}` }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: hexToRgba(domain.color,.15), boxShadow: `0 0 12px ${hexToRgba(domain.color,.2)}` }}>
                      <DomainIcon name={domain.icon} size={16} color={domain.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate text-content">{domain.name}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: hexToRgba(sc,.15), color: sc, border: `1px solid ${hexToRgba(sc,.25)}` }}>
                          {sl}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px]" style={{ color: '#3D4F6E' }}><Target size={9} className="inline mr-0.5" />{completedGoals}/{goalCount} obj.</span>
                        {todayDom.length > 0 && (
                          <span className="text-[10px]" style={{ color: '#3D4F6E' }}><CheckCircle2 size={9} className="inline mr-0.5" />{doneTodayDom.length}/{todayDom.length} auj.</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-heading font-extrabold text-base" style={{ color: domain.color }}>{pct}%</span>
                      <ArrowRight size={13} className="opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: domain.color }} />
                    </div>
                  </div>
                  <ProgressBar value={pct} color={domain.color} height="sm" glow />
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Heatmap */}
      <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(145deg,rgba(14,18,36,.9),rgba(9,13,26,.95))', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-heading font-bold text-sm uppercase tracking-widest" style={{ color: '#7A8BAD' }}>Activité</h2>
            <p className="text-[10px] mt-0.5" style={{ color: '#1E2A40' }}>16 semaines · {totalDone} tâches faites</p>
          </div>
          <div className="flex items-center gap-1.5">
            {[['rgba(255,94,122,.4)','0%'],['rgba(200,134,90,.5)','<50'],['rgba(61,216,250,.5)','<80'],['rgba(0,229,176,.7)','✓']].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm" style={{ background: c }} />
                <span className="text-[8px]" style={{ color: '#3D4F6E' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-0.5 overflow-x-auto pb-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5 flex-1 min-w-[10px]">
              {week.map((day, di) => {
                const rate = getCompletionRate(tasks, day)
                const isT  = isSameDay(day, today)
                return (
                  <div key={di}
                    className="rounded-sm cursor-pointer hover:scale-110 transition-transform"
                    style={{ aspectRatio:'1', background: heatColor(rate), border: `1px solid ${isT ? '#00E5B0' : heatBorder(rate)}`, boxShadow: isT ? '0 0 6px rgba(0,229,176,.5)' : 'none' }}
                    onMouseEnter={() => setHoveredDay({ date: day, rate })}
                    onMouseLeave={() => setHoveredDay(null)}
                  />
                )
              })}
            </div>
          ))}
        </div>
        {hoveredDay && (
          <div className="mt-2 text-[11px] flex items-center gap-2" style={{ color: '#7A8BAD' }}>
            <span className="font-semibold capitalize" style={{ color: '#E8EDF7' }}>{format(hoveredDay.date, 'EEEE d MMMM', { locale: fr })}</span>
            <span>·</span>
            {hoveredDay.rate === null
              ? <span style={{ color: '#3D4F6E' }}>Aucune tâche</span>
              : <span style={{ color: hoveredDay.rate >= 80 ? '#00E5B0' : hoveredDay.rate >= 50 ? '#3DD8FA' : '#C8865A' }}>{hoveredDay.rate}% complété</span>}
          </div>
        )}
      </div>

      {/* Raccourcis */}
      <div className="grid grid-cols-2 gap-3">
        {([
          { href: '/tasks',      icon: <ListTodo  size={18} />, color: '#00E5B0', label: 'Tâches du jour', value: todayPct === 100 ? '✓ Tout fait !' : `${doneTasks.length}/${todayTasks.length}`, sub: todayTasks.length === 0 ? 'Rien de planifié' : `${100-todayPct}% restant`, progress: todayPct },
          { href: '/goals',      icon: <Target    size={18} />, color: '#3DD8FA', label: 'Objectifs',      value: goals.length,  sub: `${goals.filter(g=>{const ts=tasks.filter(t=>t.goalId===g.id);return ts.length>0&&ts.every(t=>t.done)}).length} complétés`, progress: null },
          { href: '/challenges', icon: <Trophy    size={18} />, color: '#C8865A', label: 'Challenges',     value: activeCount,   sub: activeCount === 0 ? 'Aucun actif' : `${activeCount} en cours`, progress: null },
          { href: '/coach',      icon: <Sparkles  size={18} />, color: '#7B5EA7', label: 'Coach IA',       value: '→',           sub: 'Insights & conseils', progress: null },
        ] as const).map((item) => (
          <Link key={item.href} href={item.href}
            className="group rounded-2xl p-4 flex flex-col gap-2 transition-all hover:scale-[1.02]"
            style={{ background: 'linear-gradient(145deg,rgba(14,18,36,.9),rgba(9,13,26,.95))', border: `1px solid ${hexToRgba(item.color,.15)}` }}>
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: hexToRgba(item.color,.14), color: item.color }}>{item.icon}</div>
              <ArrowRight size={13} className="opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: item.color }} />
            </div>
            <div>
              <div className="font-heading font-extrabold text-lg leading-none" style={{ color: item.color }}>{item.value}</div>
              <div className="text-[10px] uppercase tracking-widest font-semibold mt-0.5" style={{ color: '#3D4F6E' }}>{item.label}</div>
              <div className="text-[10px] mt-0.5" style={{ color: '#1E2A40' }}>{item.sub}</div>
            </div>
            {item.progress !== null && <ProgressBar value={item.progress} color={item.color} height="sm" />}
          </Link>
        ))}
      </div>

      {/* Badges */}
      <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(145deg,rgba(14,18,36,.9),rgba(9,13,26,.95))', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-sm uppercase tracking-widest" style={{ color: '#7A8BAD' }}>Badges</h2>
          <span className="text-[10px] font-semibold" style={{ color: '#3D4F6E' }}>
            {badges.filter((b) => b.unlockedAt).length} / {badges.length}
          </span>
        </div>
        <div className="grid grid-cols-5 md:grid-cols-7 gap-2">
          {badges.map((badge) => (
            <div key={badge.id} title={badge.description}
              className="flex flex-col items-center gap-1 p-2 rounded-xl"
              style={{
                background: badge.unlockedAt ? 'rgba(0,229,176,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${badge.unlockedAt ? 'rgba(0,229,176,0.20)' : 'rgba(255,255,255,0.05)'}`,
                opacity: badge.unlockedAt ? 1 : 0.30,
                filter:  badge.unlockedAt ? 'none' : 'grayscale(1)',
              }}>
              <span className="text-xl">{badge.icon}</span>
              <span className="text-[8px] text-center leading-tight font-semibold" style={{ color: badge.unlockedAt ? '#E8EDF7' : '#3D4F6E' }}>{badge.title}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
