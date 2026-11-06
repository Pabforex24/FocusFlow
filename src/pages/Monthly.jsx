import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, CalendarDays, ChevronLeft, ChevronRight, Layers, Medal, Sparkles, Target, TrendingUp } from 'lucide-react'
import DomainTile from '../components/DomainTile.jsx'
import { IconButton } from '../components/ui/Button.jsx'
import { Card, CardHeader } from '../components/ui/Card.jsx'
import { EmptyState } from '../components/ui/EmptyState.jsx'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { ProgressRing } from '../components/ui/ProgressBar.jsx'
import { StatCard } from '../components/ui/StatCard.jsx'
import { useData } from '../contexts/DataContext.jsx'
import { formatLong, formatMonth, formatShort, fromKey } from '../lib/dates.js'
import { domainBreakdown, goalProgress, heatmap, monthSummary, rateColor } from '../lib/stats.js'
import { cn } from '../lib/cn.js'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const WEEKDAY_ORDER = [6, 0, 1, 2, 3, 4, 5]

function MonthlyTrend({ cells, today }) {
  const visible = cells.filter((c) => c.key <= today)
  const containerRef = useRef(null)
  const [width, setWidth] = useState(640)
  const [hovered, setHovered] = useState(null)

  useEffect(() => {
    const node = containerRef.current
    if (!node) return undefined
    const update = () => setWidth(Math.max(280, Math.round(node.getBoundingClientRect().width)))
    update()
    if (!('ResizeObserver' in window)) {
      window.addEventListener('resize', update)
      return () => window.removeEventListener('resize', update)
    }
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

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

  const height = 236
  const pad = { left: 34, right: 18, top: 20, bottom: 34 }
  const innerWidth = Math.max(1, width - pad.left - pad.right)
  const innerHeight = height - pad.top - pad.bottom
  const max = Math.max(total, 1)
  const x = (index) => pad.left + (points.length === 1 ? innerWidth / 2 : (index / (points.length - 1)) * innerWidth)
  const y = (value) => pad.top + innerHeight - (value / max) * innerHeight
  const line = (key) => points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ')
  const donePath = line('done')
  const totalPath = line('total')
  const areaPath = points.length > 1 ? `${donePath} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)} Z` : ''
  const grid = [0, 0.5, 1]
  const tickCount = Math.min(4, points.length)
  const xIndexes = Array.from({ length: tickCount }, (_, index) => (
    tickCount === 1 ? 0 : Math.round((index / (tickCount - 1)) * (points.length - 1))
  )).filter((value, index, all) => all.indexOf(value) === index)
  const activeIndex = hovered === null ? points.length - 1 : Math.min(hovered, points.length - 1)
  const active = points[activeIndex]

  const onPointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - rect.left - pad.left) / innerWidth
    setHovered(Math.max(0, Math.min(points.length - 1, Math.round(ratio * (points.length - 1)))))
  }

  const tooltipWidth = 108
  const tooltipHeight = 40
  const tooltipX = Math.min(Math.max(x(activeIndex) - tooltipWidth / 2, pad.left), width - pad.right - tooltipWidth)
  const tooltipY = Math.max(pad.top, y(active.done) - tooltipHeight - 12)

  return (
    <div ref={containerRef}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-brand-500" aria-hidden />Réalisé <strong className="font-semibold text-fg tabular-nums">{active.done}</strong></span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full border border-line bg-surface-2" aria-hidden />Planifié <strong className="font-semibold text-fg tabular-nums">{active.total}</strong></span>
          <span>Reste <strong className="font-semibold text-fg tabular-nums">{Math.max(0, active.total - active.done)}</strong></span>
        </div>
        <span className="text-xs text-subtle">{hovered === null ? 'Cumul jusqu’au' : 'Le'} {formatShort(active.key)}</span>
      </div>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full touch-pan-y"
        role="img" aria-label={`Progression cumulée : ${last.done} tâches réalisées sur ${last.total} planifiées`}
        onPointerMove={onPointerMove} onPointerLeave={() => setHovered(null)}>
        <title>Progression cumulée du mois</title>
        <defs>
          <linearGradient id="cumulative-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" style={{ stopColor: 'rgb(var(--accent-rgb))', stopOpacity: 0.28 }} />
            <stop offset="1" style={{ stopColor: 'rgb(var(--accent-rgb))', stopOpacity: 0.02 }} />
          </linearGradient>
        </defs>
        {grid.map((ratio) => {
          const value = Math.round(max * ratio)
          const lineY = y(value)
          return (
            <g key={ratio}>
              <line x1={pad.left} x2={width - pad.right} y1={lineY} y2={lineY} stroke="var(--line)" strokeDasharray="4 7" />
              <text x={pad.left - 8} y={lineY + 4} textAnchor="end" fill="var(--subtle)" fontSize="11">{value}</text>
            </g>
          )
        })}
        {areaPath && <path d={areaPath} fill="url(#cumulative-area)" />}
        <path d={totalPath} fill="none" stroke="var(--muted)" strokeWidth="1.8" strokeDasharray="6 6" opacity="0.55" />
        <path d={donePath} fill="none" stroke="rgb(var(--accent-rgb))" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
        <line x1={x(activeIndex)} x2={x(activeIndex)} y1={pad.top} y2={y(0)} stroke="rgb(var(--accent-rgb))" strokeWidth="1" strokeDasharray="3 5" opacity="0.4" />
        <circle cx={x(activeIndex)} cy={y(active.done)} r="4.5" fill="rgb(var(--accent-rgb))" stroke="var(--surface)" strokeWidth="2" />
        {hovered !== null && (
          <g pointerEvents="none">
            <rect x={tooltipX} y={tooltipY} width={tooltipWidth} height={tooltipHeight} rx="9" fill="var(--surface)" stroke="var(--line)" />
            <text x={tooltipX + 9} y={tooltipY + 15} fill="var(--muted)" fontSize="10">{formatShort(active.key)}</text>
            <text x={tooltipX + 9} y={tooltipY + 30} fill="var(--fg)" fontSize="11" fontWeight="600">{active.done}/{active.total} tâches</text>
          </g>
        )}
        {xIndexes.map((index) => (
          <text key={index} x={x(index)} y={height - 8} textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'} fill="var(--subtle)" fontSize="11">{points[index].day}</text>
        ))}
      </svg>
    </div>
  )
}

function WeekdayChart({ stats }) {
  return (
    <div className="grid grid-cols-7 gap-1.5 sm:gap-2" role="img" aria-label="Taux de complétion moyen, du dimanche au samedi">
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

function ActivityHeatmap({ weeks }) {
  const cells = weeks.flat()
  const tracked = cells.filter((cell) => !cell.future && cell.total > 0)
  const done = tracked.reduce((sum, cell) => sum + cell.done, 0)
  const total = tracked.reduce((sum, cell) => sum + cell.total, 0)
  const rate = total ? Math.round((done / total) * 100) : null
  const activeDays = tracked.filter((cell) => cell.done > 0).length
  const monthLabels = weeks.map((week) => {
    const first = week.find((cell) => cell.key.endsWith('-01'))
    return first ? fromKey(first.key).toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '') : ''
  })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-surface-2/60 px-3 py-2">
          <p className="text-[10px] font-semibold tracking-wide text-subtle uppercase">Jours actifs</p>
          <p className="mt-0.5 text-lg font-semibold text-fg tabular-nums">{activeDays}</p>
        </div>
        <div className="rounded-xl bg-surface-2/60 px-3 py-2">
          <p className="text-[10px] font-semibold tracking-wide text-subtle uppercase">Terminées</p>
          <p className="mt-0.5 text-lg font-semibold text-fg tabular-nums">{done}</p>
        </div>
        <div className="rounded-xl bg-surface-2/60 px-3 py-2">
          <p className="text-[10px] font-semibold tracking-wide text-subtle uppercase">Taux</p>
          <p className="mt-0.5 text-lg font-semibold text-fg tabular-nums">{rate === null ? '—' : `${rate} %`}</p>
        </div>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-max gap-2">
          <div className="flex shrink-0 flex-col gap-1">
            <span className="mb-1 h-3" aria-hidden />
            {WEEKDAYS.map((day, index) => (
              <span key={index} className="grid size-4 place-items-center text-[9px] font-medium text-subtle sm:size-5">{day}</span>
            ))}
          </div>
          <div>
            <div className="mb-1 flex h-3 gap-1">
              {weeks.map((_, index) => (
                <span key={index} className="w-4 truncate text-[8px] leading-none text-subtle sm:w-5">{monthLabels[index]}</span>
              ))}
            </div>
            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((cell) => {
                    const label = cell.total
                      ? `${formatShort(cell.key)} : ${cell.done}/${cell.total} tâche${cell.total > 1 ? 's' : ''}, ${Math.round(cell.rate * 100)} %`
                      : `${formatShort(cell.key)} : aucune tâche`
                    return cell.future ? (
                      <span key={cell.key} className="size-4 rounded-[5px] sm:size-5" aria-hidden />
                    ) : (
                      <Link key={cell.key} to={`/tasks?day=${cell.key}`} aria-label={label} title={label}
                        className={cn('size-4 rounded-[5px] transition hover:scale-110 hover:ring-2 hover:ring-brand-400/60 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none sm:size-5',
                          cell.rate === null && 'bg-surface-2')}
                        style={cell.rate !== null ? { backgroundColor: rateColor(cell.rate) } : undefined} />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-subtle">
        <span>Chaque carré ouvre la journée correspondante.</span>
        <Legend />
      </div>
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
  const byDomainTotal = byDomain.reduce((sum, item) => sum + item.total, 0)
  const weekdayStats = WEEKDAY_ORDER.map((index) => {
    const cells = m.cells.filter((c) => c.weekday === index && c.key <= today)
    const total = cells.reduce((sum, c) => sum + c.total, 0)
    const done = cells.reduce((sum, c) => sum + c.done, 0)
    return { label: WEEKDAY_LABELS[index], done, total, rate: total ? Math.round((done / total) * 100) : null }
  })

  if (tasks.length === 0) {
    return (
      <>
        <PageHeader title="Statistiques" />
        <EmptyState icon={TrendingUp} title="Pas encore de données">Terminez quelques tâches : vos statistiques apparaîtront ici.</EmptyState>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Statistiques" />

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
            <CardHeader icon={BarChart3} title="Rythme hebdomadaire" description="Du dimanche au samedi" />
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
            <CardHeader icon={Layers} title="Par domaine" description="Répartition des tâches du mois" />
            {byDomain.length === 0 ? <p className="text-sm text-muted">Aucune tâche liée à un domaine ce mois-ci.</p> : (
              <div className="space-y-4">
                <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                  {byDomain.map(({ domain, total }) => (
                    <span key={domain.id} style={{ width: `${(total / byDomainTotal) * 100}%`, backgroundColor: domain.color }} />
                  ))}
                </div>
                <ul className="space-y-3">
                  {byDomain.map(({ domain, done, total, pct }) => (
                    <li key={domain.id} className="flex items-center gap-3">
                      <DomainTile domain={domain} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-2 text-sm"><span className="truncate font-medium text-fg">{domain.name}</span><span className="shrink-0 tabular-nums text-muted">{done}/{total}</span></div>
                        <p className="text-xs text-subtle">{pct} % terminé</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader icon={Target} title="Objectifs" description="Avancement par objectif" />
            {goals.length === 0 ? <p className="text-sm text-muted">Aucun objectif créé.</p> : (
              <ul className="space-y-2.5">
                {goals.map((g) => {
                  const p = goalProgress(g, tasks)
                  const domain = domains.find((d) => d.id === g.domain_id)
                  return (
                    <li key={g.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2/40 p-2.5">
                      <ProgressRing value={p.pct} size={52} stroke={5} tone={p.pct === 100 ? 'success' : 'brand'}>
                        <span className="text-[11px]">{p.pct}%</span>
                      </ProgressRing>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-fg">{g.title}</p>
                        <p className="truncate text-xs text-muted">{p.done}/{p.total} tâche{p.total > 1 ? 's' : ''} · {domain?.name ?? 'Sans domaine'}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>

        <Card>
          <CardHeader icon={TrendingUp} title="Activité sur 16 semaines" description="Lundi → dimanche, les 16 dernières semaines" />
          <ActivityHeatmap weeks={weeks} />
        </Card>
      </div>
    </>
  )
}
