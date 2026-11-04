import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, CalendarDays, ChevronLeft, ChevronRight, Layers, Medal, Sparkles, Target, TrendingUp } from 'lucide-react'
import DomainTile from '../components/DomainTile.jsx'
import { IconButton } from '../components/ui/Button.jsx'
import { Card, CardHeader } from '../components/ui/Card.jsx'
import { EmptyState } from '../components/ui/EmptyState.jsx'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { ProgressBar } from '../components/ui/ProgressBar.jsx'
import { StatCard } from '../components/ui/StatCard.jsx'
import { useData } from '../contexts/DataContext.jsx'
import { formatLong, formatMonth, formatShort, fromKey } from '../lib/dates.js'
import { domainBreakdown, goalProgress, heatmap, monthSummary, rateColor } from '../lib/stats.js'
import { cn } from '../lib/cn.js'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function MonthlyTrend({ cells, today }) {
  const visible = cells.filter((c) => c.key <= today)
  if (visible.length === 0) return <p className="text-sm text-muted">Aucune journée à afficher pour ce mois.</p>

  let done = 0
  let total = 0
  const points = visible.map((c) => {
    done += c.done
    total += c.total
    return { key: c.key, day: c.day, done, total }
  })
  const last = points[points.length - 1]
  if (total === 0) return <p className="text-sm text-muted">Aucune tâche planifiée sur ce mois.</p>

  const width = 640
  const height = 220
  const pad = { left: 38, right: 16, top: 18, bottom: 30 }
  const innerWidth = width - pad.left - pad.right
  const innerHeight = height - pad.top - pad.bottom
  const max = Math.max(total, 1)
  const x = (index) => pad.left + (points.length === 1 ? innerWidth / 2 : (index / (points.length - 1)) * innerWidth)
  const y = (value) => pad.top + innerHeight - (value / max) * innerHeight
  const line = (key) => points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ')
  const donePath = line('done')
  const totalPath = line('total')
  const areaPath = points.length > 1 ? `${donePath} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)} Z` : ''
  const grid = [0, 0.5, 1]
  const xIndexes = [0, Math.floor((points.length - 1) / 2), points.length - 1].filter((v, i, all) => all.indexOf(v) === i)

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-brand-500" aria-hidden />Réalisé <strong className="font-semibold text-fg tabular-nums">{last.done}</strong></span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full border border-line bg-surface-2" aria-hidden />Planifié <strong className="font-semibold text-fg tabular-nums">{last.total}</strong></span>
          <span>Reste <strong className="font-semibold text-fg tabular-nums">{Math.max(0, last.total - last.done)}</strong></span>
        </div>
        <span className="text-xs text-subtle">Cumul jusqu’au {formatShort(last.key)}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-52 w-full" role="img" aria-label={`Progression cumulée : ${last.done} tâches réalisées sur ${last.total} planifiées`}>
        <title>Progression cumulée du mois</title>
        {grid.map((ratio) => {
          const value = Math.round(max * ratio)
          const lineY = y(value)
          return (
            <g key={ratio}>
              <line x1={pad.left} x2={width - pad.right} y1={lineY} y2={lineY} stroke="var(--line)" strokeDasharray="4 7" />
              <text x={pad.left - 8} y={lineY + 4} textAnchor="end" fill="var(--subtle)" fontSize="10">{value}</text>
            </g>
          )
        })}
        {areaPath && <path d={areaPath} fill="rgb(var(--accent-rgb))" opacity="0.12" />}
        <path d={totalPath} fill="none" stroke="var(--muted)" strokeWidth="2" strokeDasharray="6 6" opacity="0.55" />
        <path d={donePath} fill="none" stroke="rgb(var(--accent-rgb))" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(points.length - 1)} cy={y(last.done)} r="4.5" fill="rgb(var(--accent-rgb))" stroke="var(--surface)" strokeWidth="2" />
        {xIndexes.map((index) => (
          <text key={index} x={x(index)} y={height - 8} textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'} fill="var(--subtle)" fontSize="10">{points[index].day}</text>
        ))}
      </svg>
    </div>
  )
}

function WeekdayChart({ stats }) {
  return (
    <div className="grid grid-cols-7 gap-1.5 sm:gap-2" role="img" aria-label="Taux de complétion moyen par jour de la semaine">
      {stats.map((stat) => (
        <div key={stat.label} className="flex min-w-0 flex-col items-center gap-1.5">
          <span className="text-[10px] font-semibold text-muted tabular-nums">{stat.rate === null ? '—' : `${stat.rate}%`}</span>
          <div className="flex h-28 w-full items-end rounded-lg bg-surface-2/70">
            <div className={cn('w-full rounded-lg', stat.rate === null ? 'bg-line' : 'bg-linear-to-t from-brand-700 to-brand-400')}
              style={{ height: stat.rate === null ? 0 : `${Math.max(stat.rate, 5)}%` }} />
          </div>
          <span className="text-[10px] font-medium text-subtle">{stat.label}</span>
          <span className="text-[9px] text-subtle tabular-nums">{stat.done}/{stat.total}</span>
        </div>
      ))}
    </div>
  )
}

function Legend() {
  return (
    <div className="flex items-center gap-2 text-xs text-subtle">
      <span>0 %</span>
      <span className="h-2 w-24 rounded-full" style={{ background: `linear-gradient(90deg, ${rateColor(0)}, ${rateColor(0.5)}, ${rateColor(1)})` }} />
      <span>100 %</span>
    </div>
  )
}

export default function Monthly() {
  const { tasks, goals, domains, today } = useData()
  const now = fromKey(today)
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const move = (delta) => setCursor(({ year, month }) => {
    const d = new Date(year, month + delta, 1)
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const m = monthSummary(tasks, cursor.year, cursor.month)
  const offset = m.cells[0].weekday
  const weeks = heatmap(tasks, today)
  const monthKeyPrefix = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}`
  const monthTasks = tasks.filter((t) => t.scheduled_on.startsWith(monthKeyPrefix))
  const byDomain = domainBreakdown(domains, monthTasks).filter((x) => x.total > 0)
  const weekdayStats = WEEKDAY_LABELS.map((label, index) => {
    const cells = m.cells.filter((c) => c.weekday === index && c.key <= today)
    const total = cells.reduce((sum, c) => sum + c.total, 0)
    const done = cells.reduce((sum, c) => sum + c.done, 0)
    return { label, done, total, rate: total ? Math.round((done / total) * 100) : null }
  })

  if (tasks.length === 0) {
    return (
      <>
        <PageHeader title="Statistiques" subtitle="Votre régularité dans le temps" />
        <EmptyState icon={TrendingUp} title="Pas encore de données">Terminez quelques tâches : vos statistiques apparaîtront ici.</EmptyState>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Statistiques" subtitle="Votre régularité dans le temps" />

      <div className="space-y-6">
        <div className="flex items-center justify-between gap-2">
          <IconButton icon={ChevronLeft} label="Mois précédent" variant="secondary" onClick={() => move(-1)} />
          <h2 className="text-lg font-semibold text-fg first-letter:uppercase">{formatMonth(cursor.year, cursor.month)}</h2>
          <IconButton icon={ChevronRight} label="Mois suivant" variant="secondary" onClick={() => move(1)} />
        </div>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Indicateurs du mois">
          <StatCard icon={TrendingUp} tone="success" label="Taux de complétion" value={`${m.rate} %`} hint={`${m.done}/${m.count} tâches`} />
          <StatCard icon={Sparkles} tone="brand" label="XP gagnés" value={m.xp} hint="Tâches terminées" />
          <StatCard icon={CalendarDays} tone="info" label="Jours actifs" value={m.activeDays} hint="Au moins une tâche faite" />
          <StatCard icon={Medal} tone="warning" label="Meilleur jour" value={m.best ? formatShort(m.best.key) : '—'} hint={m.best ? `${Math.round(m.best.rate * 100)} % réussi` : 'Aucune donnée'} />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader icon={TrendingUp} title="Progression cumulée" description="Tâches réalisées et planifiées jour après jour" />
            <MonthlyTrend cells={m.cells} today={today} />
          </Card>

          <Card>
            <CardHeader icon={BarChart3} title="Rythme hebdomadaire" description="Taux moyen par jour de la semaine" />
            <WeekdayChart stats={weekdayStats} />
          </Card>
        </section>

        <Card>
          <CardHeader icon={CalendarDays} title="Calendrier du mois" action={<Legend />} />
          <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-subtle sm:gap-2">{WEEKDAYS.map((d, i) => <span key={i}>{d}</span>)}</div>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {Array.from({ length: offset }, (_, i) => <span key={`o${i}`} />)}
            {m.cells.map((c) => {
              const future = c.key > today
              const active = !future && c.rate !== null
              return (
                <Link key={c.key} to={`/tasks?day=${c.key}`} aria-label={`Voir les tâches du ${formatLong(c.key)}`} title={`${formatShort(c.key)} : ${c.done}/${c.total}`}
                  className={cn('grid aspect-square place-items-center rounded-lg text-xs font-semibold transition hover:scale-[1.04] hover:ring-2 hover:ring-brand-400/60 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none sm:rounded-xl sm:text-sm',
                    active ? 'text-white' : 'bg-surface-2 text-subtle', c.key === today && 'ring-2 ring-brand-500 ring-offset-2 ring-offset-surface')}
                  style={active ? { backgroundColor: rateColor(c.rate) } : undefined}>
                  {c.day}
                </Link>
              )
            })}
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader icon={Layers} title="Par domaine" description="Sur le mois affiché" />
            {byDomain.length === 0 ? <p className="text-sm text-muted">Aucune tâche liée à un domaine ce mois-ci.</p> : (
              <div className="space-y-4">
                {byDomain.map(({ domain, done, total, pct }) => (
                  <div key={domain.id} className="flex items-center gap-3">
                    <DomainTile domain={domain} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex justify-between text-sm"><span className="truncate font-medium text-fg">{domain.name}</span><span className="tabular-nums text-muted">{pct} % · {done}/{total}</span></div>
                      <ProgressBar value={pct} color={domain.color} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader icon={Target} title="Objectifs" description="Progression globale" />
            {goals.length === 0 ? <p className="text-sm text-muted">Aucun objectif créé.</p> : (
              <div className="space-y-4">
                {goals.map((g) => {
                  const p = goalProgress(g, tasks)
                  const domain = domains.find((d) => d.id === g.domain_id)
                  return (
                    <div key={g.id} className="space-y-1.5">
                      <div className="flex justify-between gap-2 text-sm"><span className="min-w-0 truncate font-medium text-fg">{g.title}</span><span className="tabular-nums text-muted">{p.pct} %</span></div>
                      <ProgressBar value={p.pct} color={domain?.color} size="sm" />
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        <Card>
          <CardHeader icon={TrendingUp} title="Activité sur 16 semaines" action={<Legend />} />
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <div className="flex min-w-max gap-1">
              {weeks.map((col, i) => (
                <div key={i} className="flex flex-col gap-1">
                  {col.map((c) => (
                    <div key={c.key} title={`${formatShort(c.key)} : ${c.total ? Math.round(c.rate * 100) + ' %' : 'aucune tâche'}`}
                      className={cn('size-4 rounded-[5px] sm:size-5', c.future ? 'bg-transparent' : c.rate === null && 'bg-surface-2')}
                      style={!c.future && c.rate !== null ? { backgroundColor: rateColor(c.rate) } : undefined} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}
