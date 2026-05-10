'use client'

import { useMemo, useState } from 'react'
import { useStore } from '@/store'
import { hexToRgba } from '@/lib/utils'
import { ProgressBar, RingProgress } from '@/components/ui/ProgressBar'
import { DomainIcon } from '@/components/domain/DomainIcon'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Flame, Zap, CheckCircle2, TrendingUp,
  Target, Calendar, Award, BarChart3,
} from 'lucide-react'
import { format, subDays, startOfWeek, eachDayOfInterval, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'

// ── Helpers ─────────────────────────────────────────────────────────────────
function getTasksForDay(tasks: ReturnType<typeof useStore.getState>['tasks'], date: Date) {
  return tasks.filter((t) => isSameDay(new Date(t.scheduledAt), date))
}
function getCompletionRate(tasks: ReturnType<typeof useStore.getState>['tasks'], date: Date) {
  const dayTasks = getTasksForDay(tasks, date)
  if (!dayTasks.length) return null
  return Math.round((dayTasks.filter((t) => t.done).length / dayTasks.length) * 100)
}

// ── Heatmap cell color ───────────────────────────────────────────────────────
function heatColor(rate: number | null): string {
  if (rate === null)  return 'rgba(255,255,255,0.04)'
  if (rate === 0)     return 'rgba(255,94,122,0.25)'
  if (rate < 50)      return 'rgba(200,134,90,0.35)'
  if (rate < 80)      return 'rgba(61,216,250,0.35)'
  return 'rgba(0,229,176,0.55)'
}
function heatBorder(rate: number | null): string {
  if (rate === null)  return 'rgba(255,255,255,0.04)'
  if (rate === 0)     return 'rgba(255,94,122,0.40)'
  if (rate < 50)      return 'rgba(200,134,90,0.50)'
  if (rate < 80)      return 'rgba(61,216,250,0.50)'
  return 'rgba(0,229,176,0.70)'
}

export default function StatsPage() {
  const { tasks, domains, goals, streak, userStats, getDomainProgress, getGoalProgress } = useStore()
  const [hoveredDay, setHoveredDay] = useState<{ date: Date; rate: number | null } | null>(null)
  const [domainTab, setDomainTab] = useState<'progress' | 'tasks'>('progress')

  // ── Heatmap — 16 semaines (112 jours) ───────────────────────────────────
  const today    = useMemo(() => new Date(), [])
  const heatDays = useMemo(() => {
    const start = startOfWeek(subDays(today, 111), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end: today })
  }, [today])

  // Grouper par semaine
  const weeks = useMemo(() => {
    const result: Date[][] = []
    let week: Date[] = []
    heatDays.forEach((d, i) => {
      week.push(d)
      if (week.length === 7 || i === heatDays.length - 1) {
        result.push(week)
        week = []
      }
    })
    return result
  }, [heatDays])

  // ── Stats globales ───────────────────────────────────────────────────────
  const totalDone   = tasks.filter((t) => t.done).length
  const totalTasks  = tasks.length
  const totalRate   = totalTasks ? Math.round((totalDone / totalTasks) * 100) : 0

  // Série des 7 derniers jours
  const last7 = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d    = subDays(today, 6 - i)
      const rate = getCompletionRate(tasks, d)
      const done = getTasksForDay(tasks, d).filter((t) => t.done).length
      const total = getTasksForDay(tasks, d).length
      return { date: d, rate, done, total }
    })
  }, [tasks, today])

  const best7   = Math.max(...last7.map((d) => d.rate ?? 0))
  const avg7    = Math.round(last7.filter((d) => d.rate !== null).reduce((a, d) => a + (d.rate ?? 0), 0) / Math.max(1, last7.filter((d) => d.rate !== null).length))

  // ── Domaines stats ───────────────────────────────────────────────────────
  const domainStats = useMemo(() => {
    return domains.map((domain) => {
      const pct        = getDomainProgress(domain.id)
      const domGoals   = goals.filter((g) => g.domainId === domain.id)
      const domTasks   = tasks.filter((t) => t.domainId === domain.id)
      const doneTasks  = domTasks.filter((t) => t.done)
      const compGoals  = domGoals.filter((g) => {
        const gt = tasks.filter((t) => t.goalId === g.id)
        return gt.length > 0 && gt.every((t) => t.done)
      })
      return { domain, pct, goalCount: domGoals.length, taskCount: domTasks.length, doneCount: doneTasks.length, completedGoals: compGoals.length }
    }).sort((a, b) => b.pct - a.pct)
  }, [domains, goals, tasks, getDomainProgress])

  const card = (icon: React.ReactNode, label: string, value: string | number, color: string, sub?: string) => (
    <div
      className="rounded-2xl p-4 flex flex-col gap-2"
      style={{
        background: `linear-gradient(145deg, rgba(14,18,36,0.95) 0%, rgba(9,13,26,0.98) 100%)`,
        border: `1px solid ${hexToRgba(color, 0.18)}`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.45)`,
      }}
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: hexToRgba(color, 0.14), color }}>
        {icon}
      </div>
      <div>
        <div className="font-heading font-extrabold text-2xl leading-none" style={{ color }}>{value}</div>
        <div className="text-[10px] uppercase tracking-widest font-semibold mt-0.5" style={{ color: '#3D4F6E' }}>{label}</div>
        {sub && <div className="text-[10px] mt-0.5" style={{ color: '#1E2A40' }}>{sub}</div>}
      </div>
    </div>
  )

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto page-enter pb-24 md:pb-8 space-y-6">
      <PageHeader title="Statistiques" subtitle="Vue d'ensemble de ta progression" icon={<BarChart3 size={18} />} />

      {/* ── KPI cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {card(<CheckCircle2 size={15} />, 'Tâches faites',   totalDone,              '#00E5B0', `sur ${totalTasks} total`)}
        {card(<TrendingUp   size={15} />, 'Taux global',     `${totalRate}%`,        '#3DD8FA', 'complétion')}
        {card(<Flame        size={15} />, 'Streak actuel',   `${streak}j`,           '#C8865A', `record: ${userStats.longestStreak}j`)}
        {card(<Zap          size={15} />, 'XP total',        userStats.xp,           '#7B5EA7', `niveau ${userStats.level}`)}
      </div>

      {/* ── Barres des 7 derniers jours ─────────────────────────────────── */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'linear-gradient(145deg, rgba(14,18,36,0.90) 0%, rgba(9,13,26,0.95) 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-heading font-bold text-sm uppercase tracking-widest" style={{ color: '#7A8BAD' }}>
              7 derniers jours
            </h2>
            <p className="text-[10px] mt-0.5" style={{ color: '#1E2A40' }}>
              moy. {avg7}% · meilleur {best7}%
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-heading font-extrabold text-xl leading-none" style={{ color: '#3DD8FA' }}>{avg7}%</div>
              <div className="text-[9px] uppercase tracking-widest" style={{ color: '#3D4F6E' }}>moyenne</div>
            </div>
          </div>
        </div>

        <div className="flex items-end gap-2 h-28">
          {last7.map(({ date, rate, done, total }, i) => {
            const h = rate === null ? 8 : Math.max(8, (rate / 100) * 100)
            const color = rate === null ? '#1a2035' : rate >= 80 ? '#00E5B0' : rate >= 50 ? '#3DD8FA' : rate > 0 ? '#C8865A' : '#FF5E7A'
            const isToday_ = isSameDay(date, today)
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                <div className="flex-1 w-full flex items-end">
                  <div
                    className="w-full rounded-t-lg transition-all duration-500 relative"
                    style={{
                      height: `${h}%`,
                      background: rate === null
                        ? 'rgba(255,255,255,0.04)'
                        : `linear-gradient(to top, ${hexToRgba(color, 0.6)}, ${hexToRgba(color, 0.9)})`,
                      boxShadow: rate !== null && rate > 0 ? `0 0 12px ${hexToRgba(color, 0.30)}` : 'none',
                      border: `1px solid ${hexToRgba(color, 0.25)}`,
                    }}
                  >
                    {/* Tooltip */}
                    <div
                      className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap rounded-lg px-2 py-1 text-[9px] font-bold pointer-events-none z-10"
                      style={{ background: '#0e1224', border: `1px solid ${hexToRgba(color, 0.40)}`, color }}
                    >
                      {rate === null ? 'Aucune tâche' : `${done}/${total} · ${rate}%`}
                    </div>
                  </div>
                </div>
                <div
                  className="text-[9px] font-semibold uppercase"
                  style={{ color: isToday_ ? '#00E5B0' : '#3D4F6E' }}
                >
                  {format(date, 'EEE', { locale: fr }).slice(0, 3)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Heatmap 16 semaines ─────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'linear-gradient(145deg, rgba(14,18,36,0.90) 0%, rgba(9,13,26,0.95) 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-sm uppercase tracking-widest" style={{ color: '#7A8BAD' }}>
            Activité — 16 semaines
          </h2>
          {/* Légende */}
          <div className="flex items-center gap-2">
            {[
              { label: '0%',   color: 'rgba(255,94,122,0.40)' },
              { label: '<50%', color: 'rgba(200,134,90,0.50)' },
              { label: '<80%', color: 'rgba(61,216,250,0.50)' },
              { label: '100%', color: 'rgba(0,229,176,0.70)'  },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                <span className="text-[8px]" style={{ color: '#3D4F6E' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Labels jours */}
        <div className="flex gap-1 mb-1 ml-0">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
            <div key={i} className="text-[8px] font-semibold flex-1 text-center" style={{ color: '#1E2A40' }}>{d}</div>
          ))}
        </div>

        {/* Grille — colonnes = semaines, lignes = jours */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1 flex-1 min-w-[10px]">
              {week.map((day, di) => {
                const rate    = getCompletionRate(tasks, day)
                const isToday_ = isSameDay(day, today)
                return (
                  <div
                    key={di}
                    className="rounded-sm cursor-pointer transition-transform hover:scale-110 relative"
                    style={{
                      aspectRatio: '1',
                      background: heatColor(rate),
                      border: `1px solid ${isToday_ ? '#00E5B0' : heatBorder(rate)}`,
                      boxShadow: isToday_ ? '0 0 6px rgba(0,229,176,0.5)' : 'none',
                    }}
                    onMouseEnter={() => setHoveredDay({ date: day, rate })}
                    onMouseLeave={() => setHoveredDay(null)}
                  />
                )
              })}
            </div>
          ))}
        </div>

        {/* Tooltip heatmap */}
        {hoveredDay && (
          <div className="mt-3 text-[11px] flex items-center gap-2" style={{ color: '#7A8BAD' }}>
            <span className="font-semibold capitalize" style={{ color: '#E8EDF7' }}>
              {format(hoveredDay.date, 'EEEE d MMMM', { locale: fr })}
            </span>
            <span>·</span>
            {hoveredDay.rate === null
              ? <span style={{ color: '#3D4F6E' }}>Aucune tâche planifiée</span>
              : <span style={{ color: hoveredDay.rate >= 80 ? '#00E5B0' : hoveredDay.rate >= 50 ? '#3DD8FA' : '#C8865A' }}>
                  {hoveredDay.rate}% complété
                </span>
            }
          </div>
        )}
      </div>

      {/* ── Progression par domaine ─────────────────────────────────────── */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'linear-gradient(145deg, rgba(14,18,36,0.90) 0%, rgba(9,13,26,0.95) 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-bold text-sm uppercase tracking-widest" style={{ color: '#7A8BAD' }}>
            Par domaine
          </h2>
          {/* Tabs */}
          <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {(['progress', 'tasks'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setDomainTab(tab)}
                className="px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all"
                style={{
                  background:  domainTab === tab ? 'rgba(0,229,176,0.14)' : 'transparent',
                  color:       domainTab === tab ? '#00E5B0' : '#3D4F6E',
                  border:      domainTab === tab ? '1px solid rgba(0,229,176,0.25)' : '1px solid transparent',
                }}
              >
                {tab === 'progress' ? 'Progression' : 'Tâches'}
              </button>
            ))}
          </div>
        </div>

        {domainStats.length === 0 ? (
          <p className="text-xs text-center py-6" style={{ color: '#3D4F6E' }}>Aucun domaine créé</p>
        ) : (
          <div className="space-y-4">
            {domainStats.map(({ domain, pct, goalCount, taskCount, doneCount, completedGoals }) => (
              <div key={domain.id}>
                <div className="flex items-center gap-3 mb-2">
                  {/* Ring */}
                  <RingProgress value={pct} size={38} strokeWidth={3} color={domain.color}>
                    <span className="text-[7px] font-extrabold" style={{ color: domain.color }}>{pct}%</span>
                  </RingProgress>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <DomainIcon name={domain.icon} size={12} color={domain.color} />
                        <span className="text-sm font-semibold text-content truncate">{domain.name}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {domainTab === 'progress' ? (
                          <>
                            <span className="text-[10px]" style={{ color: '#3D4F6E' }}>
                              <Target size={8} className="inline mr-0.5" />{completedGoals}/{goalCount}
                            </span>
                            <span className="font-heading font-bold text-sm" style={{ color: domain.color }}>{pct}%</span>
                          </>
                        ) : (
                          <>
                            <span className="text-[10px]" style={{ color: '#3D4F6E' }}>
                              {doneCount}/{taskCount} tâches
                            </span>
                            <span className="font-heading font-bold text-sm" style={{ color: domain.color }}>
                              {taskCount ? Math.round((doneCount / taskCount) * 100) : 0}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <ProgressBar
                      value={domainTab === 'progress' ? pct : (taskCount ? Math.round((doneCount / taskCount) * 100) : 0)}
                      color={domain.color}
                      height="sm"
                      glow
                    />
                  </div>
                </div>

                {/* Objectifs du domaine */}
                {domainTab === 'progress' && (
                  <div className="ml-[50px] space-y-1">
                    {goals.filter((g) => g.domainId === domain.id).slice(0, 3).map((goal) => {
                      const gPct = getGoalProgress(goal.id)
                      return (
                        <div key={goal.id} className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: domain.color }} />
                          <span className="text-[10px] truncate flex-1" style={{ color: '#3D4F6E' }}>{goal.title}</span>
                          <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: gPct >= 80 ? '#00E5B0' : '#3D4F6E' }}>{gPct}%</span>
                        </div>
                      )
                    })}
                    {goals.filter((g) => g.domainId === domain.id).length > 3 && (
                      <p className="text-[9px] ml-3" style={{ color: '#1E2A40' }}>
                        +{goals.filter((g) => g.domainId === domain.id).length - 3} autres objectifs
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Badges débloqués ────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'linear-gradient(145deg, rgba(14,18,36,0.90) 0%, rgba(9,13,26,0.95) 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-sm uppercase tracking-widest" style={{ color: '#7A8BAD' }}>
            Badges
          </h2>
          <span className="text-[10px] font-semibold" style={{ color: '#3D4F6E' }}>
            {useStore.getState().badges.filter((b) => b.unlockedAt).length} / {useStore.getState().badges.length}
          </span>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
          {useStore.getState().badges.map((badge) => {
            const unlocked = !!badge.unlockedAt
            return (
              <div
                key={badge.id}
                className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all"
                title={badge.description}
                style={{
                  background:  unlocked ? 'rgba(0,229,176,0.08)' : 'rgba(255,255,255,0.03)',
                  border:      `1px solid ${unlocked ? 'rgba(0,229,176,0.20)' : 'rgba(255,255,255,0.05)'}`,
                  opacity:     unlocked ? 1 : 0.35,
                  filter:      unlocked ? 'none' : 'grayscale(1)',
                }}
              >
                <span className="text-xl">{badge.icon}</span>
                <span className="text-[8px] text-center leading-tight font-semibold" style={{ color: unlocked ? '#E8EDF7' : '#3D4F6E' }}>
                  {badge.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
