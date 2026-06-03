'use client'

export const dynamic = 'force-dynamic'

import { useMemo, useState } from 'react'
import { useStore } from '@/store'
import { hexToRgba } from '@/lib/utils'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { DomainIcon } from '@/components/domain/DomainIcon'
import {
  format, subDays, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isSameMonth, subMonths, addMonths,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, TrendingUp, CheckCircle2, Flame, Zap, Target } from 'lucide-react'

// ── SVG line chart helper ────────────────────────────────────────────────────
function LineChart({
  data, color = '#00E5B0', height = 120, showArea = true,
}: {
  data: { value: number; label: string }[]
  color?: string
  height?: number
  showArea?: boolean
}) {
  const W = 300
  const H = height
  const PAD = { top: 8, right: 8, bottom: 24, left: 28 }
  const cW = W - PAD.left - PAD.right
  const cH = H - PAD.top - PAD.bottom

  const values = data.map((d) => d.value)
  const maxV   = Math.max(...values, 1)
  const minV   = 0

  const pts = data.map((d, i) => ({
    x: PAD.left + (i / Math.max(data.length - 1, 1)) * cW,
    y: PAD.top + cH - ((d.value - minV) / (maxV - minV)) * cH,
    ...d,
  }))

  // Smooth cubic bezier path
  const linePath = pts.map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const prev = pts[i - 1]
    const cp1x = prev.x + (p.x - prev.x) * 0.4
    const cp2x = p.x  - (p.x - prev.x) * 0.4
    return `C ${cp1x} ${prev.y} ${cp2x} ${p.y} ${p.x} ${p.y}`
  }).join(' ')

  const areaPath = linePath
    + ` L ${pts[pts.length - 1].x} ${PAD.top + cH}`
    + ` L ${pts[0].x} ${PAD.top + cH} Z`

  // Y axis labels
  const yLabels = [0, Math.round(maxV / 2), maxV]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`area-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yLabels.map((v, i) => {
        const y = PAD.top + cH - ((v - minV) / (maxV - minV)) * cH
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
              stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <text x={PAD.left - 4} y={y + 4} fill="rgba(255,255,255,0.25)"
              fontSize="8" textAnchor="end">{v}</text>
          </g>
        )
      })}

      {/* Area fill */}
      {showArea && (
        <path d={areaPath} fill={`url(#area-${color.replace('#','')})`} />
      )}

      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 4px ${color}60)` }} />

      {/* Dots + X labels */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill={color}
            style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
          {(i === 0 || i === pts.length - 1 || i % Math.ceil(pts.length / 6) === 0) && (
            <text x={p.x} y={H - 4} fill="rgba(255,255,255,0.30)"
              fontSize="7" textAnchor="middle">{p.label}</text>
          )}
        </g>
      ))}
    </svg>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function MensuelPage() {
  const { tasks, domains, goals, streak, userStats, getDomainProgress } = useStore()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [activeTab, setActiveTab] = useState<'completion' | 'xp' | 'domaines'>('completion')

  const monthStart = startOfMonth(currentMonth)
  const monthEnd   = endOfMonth(currentMonth)
  const monthDays  = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // ── Stats du mois ──────────────────────────────────────────────────────────
  const monthTasks  = tasks.filter((t) => isSameMonth(new Date(t.scheduledAt), currentMonth))
  const doneTasks   = monthTasks.filter((t) => t.done)
  const completionRate = monthTasks.length ? Math.round((doneTasks.length / monthTasks.length) * 100) : 0

  // Taux de complétion par jour
  const dailyCompletion = monthDays.map((day) => {
    const dayTasks = tasks.filter((t) => isSameDay(new Date(t.scheduledAt), day))
    const done     = dayTasks.filter((t) => t.done).length
    const rate     = dayTasks.length ? Math.round((done / dayTasks.length) * 100) : 0
    return { value: rate, label: format(day, 'd') }
  })

  // XP gagné par jour (simulé depuis les tâches faites)
  const dailyXP = monthDays.map((day) => {
    const xp = tasks
      .filter((t) => t.done && t.doneAt && isSameDay(new Date(t.doneAt), day))
      .reduce((sum, t) => sum + (t.xpValue ?? 10), 0)
    return { value: xp, label: format(day, 'd') }
  })

  // Tâches faites par domaine ce mois
  const domainStats = useMemo(() => domains.map((d) => {
    const domMonthTasks = monthTasks.filter((t) => t.domainId === d.id)
    const domDone       = domMonthTasks.filter((t) => t.done).length
    const rate          = domMonthTasks.length ? Math.round((domDone / domMonthTasks.length) * 100) : 0
    return { domain: d, total: domMonthTasks.length, done: domDone, rate }
  }).sort((a, b) => b.done - a.done), [domains, monthTasks])

  // ── KPIs du mois ──────────────────────────────────────────────────────────
  const totalXPMonth  = tasks
    .filter((t) => t.done && t.doneAt && isSameMonth(new Date(t.doneAt), currentMonth))
    .reduce((sum, t) => sum + (t.xpValue ?? 10), 0)
  const bestDay = dailyCompletion.reduce((best, d, i) =>
    d.value > (best?.value ?? 0) ? { ...d, day: monthDays[i] } : best,
    null as null | { value: number; label: string; day: Date }
  )
  const activeDays = dailyCompletion.filter((d) => d.value > 0).length

  const isPrevMonth = isSameMonth(currentMonth, subMonths(new Date(), 1))
  const isCurrentMonth = isSameMonth(currentMonth, new Date())

  return (
    <div
      className="px-4 pt-4 md:p-8 max-w-3xl mx-auto page-enter pb-24 md:pb-8 space-y-5"
      style={{ marginTop: 'calc(env(safe-area-inset-top) + 52px)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-extrabold text-2xl tracking-tight text-content">
            Mensuel
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#3D4F6E' }}>
            Tes performances du mois
          </p>
        </div>
        {/* Month navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
            style={{ color: '#7A8BAD', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-sm font-bold text-content capitalize w-24 text-center">
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </span>
          <button
            onClick={() => !isCurrentMonth && setCurrentMonth(addMonths(currentMonth, 1))}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
            style={{
              color: isCurrentMonth ? '#1E2A40' : '#7A8BAD',
              border: '1px solid rgba(255,255,255,0.08)',
              opacity: isCurrentMonth ? 0.4 : 1,
            }}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { label: 'Taux de complétion', value: `${completionRate}%`, sub: `${doneTasks.length}/${monthTasks.length} tâches`, icon: <CheckCircle2 size={13} />, color: '#00E5B0' },
          { label: 'XP gagnés',          value: totalXPMonth,         sub: `ce mois`,                                          icon: <Zap size={13} />,          color: '#7B5EA7' },
          { label: 'Jours actifs',        value: `${activeDays}j`,    sub: `sur ${monthDays.length} jours`,                    icon: <Flame size={13} />,        color: '#C8865A' },
          { label: 'Meilleur jour',       value: bestDay ? `${bestDay.value}%` : '—', sub: bestDay ? format(bestDay.day, 'd MMMM', { locale: fr }) : 'Aucun', icon: <TrendingUp size={13} />, color: '#3DD8FA' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl p-3 flex items-center gap-3"
            style={{
              background: 'linear-gradient(145deg,rgba(14,18,36,0.95),rgba(9,13,26,0.98))',
              border: `1px solid ${hexToRgba(card.color, 0.18)}`,
            }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: hexToRgba(card.color, 0.14), color: card.color }}>
              {card.icon}
            </div>
            <div className="min-w-0">
              <div className="font-heading font-extrabold text-lg leading-none" style={{ color: card.color }}>{card.value}</div>
              <div className="text-[9px] font-bold uppercase tracking-wider mt-0.5 truncate" style={{ color: '#3D4F6E' }}>{card.label}</div>
              <div className="text-[9px] truncate" style={{ color: '#1E2A40' }}>{card.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart tabs */}
      <div className="rounded-2xl p-4"
        style={{ background: 'linear-gradient(145deg,rgba(14,18,36,0.90),rgba(9,13,26,0.95))', border: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Tab selector */}
        <div className="flex items-center gap-2 mb-4">
          {([
            { key: 'completion', label: 'Complétion', color: '#00E5B0' },
            { key: 'xp',         label: 'XP',         color: '#7B5EA7' },
            { key: 'domaines',   label: 'Domaines',   color: '#3DD8FA' },
          ] as const).map((tab) => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
              style={{
                background: activeTab === tab.key ? hexToRgba(tab.color, 0.14) : 'rgba(255,255,255,0.04)',
                color:      activeTab === tab.key ? tab.color : '#3D4F6E',
                border:     `1px solid ${activeTab === tab.key ? hexToRgba(tab.color, 0.28) : 'transparent'}`,
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Completion curve */}
        {activeTab === 'completion' && (
          <div>
            <div className="flex items-end justify-between mb-3">
              <div>
                <span className="font-heading font-extrabold text-2xl" style={{ color: '#00E5B0' }}>{completionRate}%</span>
                <span className="text-xs ml-2" style={{ color: '#3D4F6E' }}>taux moyen ce mois</span>
              </div>
            </div>
            <LineChart data={dailyCompletion} color="#00E5B0" height={130} />
          </div>
        )}

        {/* XP curve */}
        {activeTab === 'xp' && (
          <div>
            <div className="flex items-end justify-between mb-3">
              <div>
                <span className="font-heading font-extrabold text-2xl" style={{ color: '#7B5EA7' }}>{totalXPMonth}</span>
                <span className="text-xs ml-2" style={{ color: '#3D4F6E' }}>XP gagnés ce mois</span>
              </div>
            </div>
            <LineChart data={dailyXP} color="#7B5EA7" height={130} />
          </div>
        )}

        {/* Domaines breakdown */}
        {activeTab === 'domaines' && (
          <div className="space-y-3">
            {domainStats.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: '#3D4F6E' }}>Aucune donnée ce mois</p>
            ) : domainStats.map(({ domain, total, done, rate }) => (
              <div key={domain.id}>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <DomainIcon name={domain.icon} size={13} color={domain.color} />
                  <span className="text-sm font-semibold text-content flex-1 truncate">{domain.name}</span>
                  <span className="text-xs font-bold flex-shrink-0" style={{ color: domain.color }}>{rate}%</span>
                  <span className="text-[10px] flex-shrink-0" style={{ color: '#3D4F6E' }}>{done}/{total}</span>
                </div>
                <ProgressBar value={rate} color={domain.color} height="sm" glow />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Calendrier du mois */}
      <div className="rounded-2xl p-4"
        style={{ background: 'linear-gradient(145deg,rgba(14,18,36,0.90),rgba(9,13,26,0.95))', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="font-heading font-bold text-sm uppercase tracking-widest mb-4" style={{ color: '#7A8BAD' }}>
          Calendrier d'activité
        </h3>
        {/* Day labels */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['L','M','M','J','V','S','D'].map((d, i) => (
            <div key={i} className="text-center text-[9px] font-bold" style={{ color: '#1E2A40' }}>{d}</div>
          ))}
        </div>
        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for first week offset */}
          {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
            <div key={`e-${i}`} />
          ))}
          {monthDays.map((day) => {
            const rate    = dailyCompletion.find((_, i) => isSameDay(monthDays[i], day))?.value ?? 0
            const dayTasks = tasks.filter((t) => isSameDay(new Date(t.scheduledAt), day))
            const isToday  = isSameDay(day, new Date())
            const bg =
              dayTasks.length === 0 ? 'rgba(255,255,255,0.03)' :
              rate === 100           ? 'rgba(0,229,176,0.55)'   :
              rate >= 60             ? 'rgba(61,216,250,0.35)'  :
              rate > 0               ? 'rgba(200,134,90,0.35)'  :
                                       'rgba(255,94,122,0.25)'

            return (
              <div key={day.toISOString()}
                className="aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold relative"
                style={{
                  background: bg,
                  color: dayTasks.length === 0 ? '#1E2A40' : rate === 100 ? '#050812' : '#E8EDF7',
                  border: isToday ? '1px solid rgba(0,229,176,0.70)' : '1px solid transparent',
                  boxShadow: isToday ? '0 0 8px rgba(0,229,176,0.40)' : 'none',
                }}>
                {format(day, 'd')}
              </div>
            )
          })}
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          {[
            { c: 'rgba(255,94,122,0.25)',  l: '0%'   },
            { c: 'rgba(200,134,90,0.35)',  l: '<60%'  },
            { c: 'rgba(61,216,250,0.35)',  l: '<100%' },
            { c: 'rgba(0,229,176,0.55)',   l: '100%'  },
          ].map(({ c, l }) => (
            <div key={l} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ background: c }} />
              <span className="text-[9px]" style={{ color: '#3D4F6E' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Progression objectifs */}
      {goals.length > 0 && (
        <div className="rounded-2xl p-4"
          style={{ background: 'linear-gradient(145deg,rgba(14,18,36,0.90),rgba(9,13,26,0.95))', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="font-heading font-bold text-sm uppercase tracking-widest mb-4" style={{ color: '#7A8BAD' }}>
            Progression objectifs
          </h3>
          <div className="space-y-3">
            {goals.slice(0, 6).map((goal) => {
              const gt   = tasks.filter((t) => t.goalId === goal.id)
              const done = gt.filter((t) => t.done).length
              const pct  = gt.length ? Math.round((done / gt.length) * 100) : 0
              const domain = domains.find((d) => d.id === goal.domainId)
              return (
                <div key={goal.id}>
                  <div className="flex items-center gap-2 mb-1.5">
                    {domain && <DomainIcon name={domain.icon} size={11} color={domain.color} />}
                    <span className="text-xs font-medium text-content flex-1 truncate">{goal.title}</span>
                    <span className="text-xs font-bold flex-shrink-0" style={{ color: domain?.color ?? '#00E5B0' }}>{pct}%</span>
                  </div>
                  <ProgressBar value={pct} color={domain?.color ?? '#00E5B0'} height="sm" />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
