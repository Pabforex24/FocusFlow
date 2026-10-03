import { useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Layers, Medal, Sparkles, Target, TrendingUp } from 'lucide-react'
import DomainTile from '../components/DomainTile.jsx'
import { IconButton } from '../components/ui/Button.jsx'
import { Card, CardHeader } from '../components/ui/Card.jsx'
import { EmptyState } from '../components/ui/EmptyState.jsx'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { ProgressBar } from '../components/ui/ProgressBar.jsx'
import { StatCard } from '../components/ui/StatCard.jsx'
import { useData } from '../contexts/DataContext.jsx'
import { formatMonth, formatShort, fromKey } from '../lib/dates.js'
import { domainBreakdown, goalProgress, heatmap, monthSummary, rateColor } from '../lib/stats.js'
import { cn } from '../lib/cn.js'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

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

        <Card>
          <CardHeader icon={CalendarDays} title="Calendrier du mois" action={<Legend />} />
          <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-subtle sm:gap-2">{WEEKDAYS.map((d, i) => <span key={i}>{d}</span>)}</div>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {Array.from({ length: offset }, (_, i) => <span key={`o${i}`} />)}
            {m.cells.map((c) => {
              const future = c.key > today
              const active = !future && c.rate !== null
              return (
                <div key={c.key} title={`${formatShort(c.key)} : ${c.done}/${c.total}`}
                  className={cn('grid aspect-square place-items-center rounded-lg text-xs font-semibold sm:rounded-xl sm:text-sm',
                    active ? 'text-white' : 'bg-surface-2 text-subtle', c.key === today && 'ring-2 ring-brand-500 ring-offset-2 ring-offset-surface')}
                  style={active ? { backgroundColor: rateColor(c.rate) } : undefined}>
                  {c.day}
                </div>
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
