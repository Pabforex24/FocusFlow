'use client'

import { useMemo } from 'react'
import { useStore } from '@/store'
import { PageHeader } from '@/components/layout/PageHeader'
import { XPBar } from '@/components/gamification/XPBar'
import { BadgesWidget } from '@/components/gamification/BadgesWidget'
import { RingProgress } from '@/components/ui/ProgressBar'
import { DomainIcon } from '@/components/domain/DomainIcon'
import { hexToRgba } from '@/lib/utils'
import { format, subDays, startOfWeek, eachDayOfInterval } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Trophy, Zap, Flame, Target } from 'lucide-react'

// ── Heatmap ───────────────────────────────────────────────────────────────────
function ActivityHeatmap() {
  const { tasks } = useStore()

  const data = useMemo(() => {
    const map: Record<string, number> = {}
    tasks.filter((t) => t.done && t.doneAt).forEach((t) => {
      const d = new Date(t.doneAt!).toISOString().split('T')[0]
      map[d] = (map[d] || 0) + 1
    })
    // Build last 84 days (12 weeks)
    return Array.from({ length: 84 }, (_, i) => {
      const date = subDays(new Date(), 83 - i)
      const key = date.toISOString().split('T')[0]
      return { date, count: map[key] || 0 }
    })
  }, [tasks])

  const maxCount = Math.max(...data.map((d) => d.count), 1)

  const getColor = (count: number) => {
    if (!count) return 'rgba(255,255,255,0.04)'
    const intensity = count / maxCount
    if (intensity < 0.25) return 'rgba(123,97,255,0.25)'
    if (intensity < 0.5)  return 'rgba(123,97,255,0.5)'
    if (intensity < 0.75) return 'rgba(123,97,255,0.75)'
    return '#7B61FF'
  }

  return (
    <div className="bg-bg-2 border border-border rounded-2xl p-5">
      <h2 className="font-heading font-bold text-sm uppercase tracking-widest text-content-2 mb-4">
        Activité — 12 semaines
      </h2>
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}>
        {Array.from({ length: 12 }, (_, week) => (
          <div key={week} className="flex flex-col gap-1">
            {data.slice(week * 7, week * 7 + 7).map((d, i) => (
              <div
                key={i}
                title={`${format(d.date, 'd MMM', { locale: fr })} — ${d.count} tâche(s)`}
                className="w-full aspect-square rounded-sm transition-colors"
                style={{ background: getColor(d.count) }}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-content-4 mt-2">
        Moins actif → Plus actif
      </p>
    </div>
  )
}

// ── Weekly bar chart ──────────────────────────────────────────────────────────
function WeeklyChart() {
  const { tasks } = useStore()

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i)
      const dayStr = date.toDateString()
      const done = tasks.filter((t) => t.done && new Date(t.doneAt || '').toDateString() === dayStr).length
      const total = tasks.filter((t) => new Date(t.scheduledAt).toDateString() === dayStr).length
      return { date, done, total, pct: total ? Math.round((done / total) * 100) : 0 }
    })
  }, [tasks])

  const maxDone = Math.max(...days.map((d) => d.done), 1)

  return (
    <div className="bg-bg-2 border border-border rounded-2xl p-5">
      <h2 className="font-heading font-bold text-sm uppercase tracking-widest text-content-2 mb-4">
        7 derniers jours
      </h2>
      <div className="flex items-end justify-between gap-2 h-28">
        {days.map((d, i) => {
          const isToday = d.date.toDateString() === new Date().toDateString()
          const barPct = d.done / maxDone
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-content-3 font-bold">{d.done}</span>
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full rounded-t-md transition-all duration-700"
                  style={{
                    height: `${Math.max(4, barPct * 100)}%`,
                    background: isToday
                      ? 'linear-gradient(180deg, #7B61FF, #A259FF)'
                      : 'rgba(123,97,255,0.3)',
                    boxShadow: isToday ? '0 0 10px rgba(123,97,255,0.4)' : 'none',
                  }}
                />
              </div>
              <span className="text-[9px] text-content-4 capitalize">
                {format(d.date, 'EEE', { locale: fr })}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Domain progress bars ──────────────────────────────────────────────────────
function DomainBars() {
  const { domains, getDomainProgress, goals } = useStore()

  return (
    <div className="bg-bg-2 border border-border rounded-2xl p-5">
      <h2 className="font-heading font-bold text-sm uppercase tracking-widest text-content-2 mb-4">
        Progression par domaine
      </h2>
      {domains.length === 0 ? (
        <p className="text-xs text-content-3 text-center py-4">Aucun domaine</p>
      ) : (
        <div className="space-y-4">
          {domains.map((d) => {
            const pct = getDomainProgress(d.id)
            const gc = goals.filter((g) => g.domainId === d.id).length
            return (
              <div key={d.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <DomainIcon name={d.icon} size={14} color={d.color} />
                    <span className="text-sm font-medium text-content">{d.name}</span>
                    <span className="text-[10px] text-content-4">{gc} objectif{gc !== 1 ? 's' : ''}</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: d.color }}>{pct}%</span>
                </div>
                <div className="h-2 bg-bg-4 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: d.color, boxShadow: `0 0 8px ${d.color}50` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ProgressionPage() {
  const { userStats, streak, tasks, activeChallenges } = useStore()
  const totalDone = tasks.filter((t) => t.done).length
  const challengesDone = activeChallenges.filter((ac) => !ac.isActive).length

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto page-enter pb-24 md:pb-8">
      <PageHeader
        title="Progression"
        subtitle="Visualise ta croissance sur tous les fronts"
      />

      {/* XP */}
      <XPBar className="mb-6" />

      {/* Stats globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { icon: '🔥', label: 'Streak actuel',     value: streak,            sub: 'jours' },
          { icon: '⚡', label: 'Record streak',      value: userStats.longestStreak, sub: 'jours' },
          { icon: '✅', label: 'Tâches complétées',  value: totalDone,         sub: 'au total' },
          { icon: '🏆', label: 'Challenges finis',   value: challengesDone,    sub: 'au total' },
        ].map((s) => (
          <div key={s.label} className="bg-bg-2 border border-border rounded-xl p-4 text-center">
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="font-heading font-extrabold text-xl text-content">{s.value}</p>
            <p className="text-[10px] text-content-3 uppercase tracking-wide mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <WeeklyChart />
        <DomainBars />
      </div>

      {/* Heatmap */}
      <div className="mb-5">
        <ActivityHeatmap />
      </div>

      {/* Badges */}
      <BadgesWidget limit={14} />
    </div>
  )
}
