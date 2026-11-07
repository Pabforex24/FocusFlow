import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarClock, CheckCircle2, ListChecks, Target, Timer } from 'lucide-react'
import DomainTile from '../components/DomainTile.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Card } from '../components/ui/Card.jsx'
import { EmptyState } from '../components/ui/EmptyState.jsx'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { ProgressBar } from '../components/ui/ProgressBar.jsx'
import { useData } from '../contexts/DataContext.jsx'
import { formatShort } from '../lib/dates.js'
import { formatDurationMinutes, taskMinutes } from '../lib/duration.js'
import { goalProgress } from '../lib/stats.js'

function TaskRow({ task, today }) {
  const minutes = taskMinutes(task)
  return (
    <li>
      <Link to={`/tasks?day=${task.scheduled_on}`} className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/40 p-3 transition hover:border-brand-400/40 hover:bg-surface-2">
        <span className={task.done ? 'text-emerald-500' : 'text-subtle'} aria-hidden>
          {task.done ? <CheckCircle2 className="size-4" /> : <ListChecks className="size-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className={task.done ? 'block truncate text-sm text-subtle line-through' : 'block truncate text-sm font-medium text-fg'}>{task.title}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
            <span>{formatShort(task.scheduled_on)}</span>
            {task.start_time && <span className="inline-flex items-center gap-1"><Timer className="size-3" aria-hidden />{task.start_time.slice(0, 5)}</span>}
            {minutes > 0 && <span>{formatDurationMinutes(minutes)}</span>}
            {!task.done && task.scheduled_on < today && <Badge tone="danger">En retard</Badge>}
          </span>
        </span>
      </Link>
    </li>
  )
}

export default function DomainDetail() {
  const { id } = useParams()
  const { domains, goals, tasks, today } = useData()
  const domain = domains.find((d) => d.id === id)
  if (!domain) return <Navigate to="/domains" replace />

  const own = tasks.filter((t) => t.domain_id === domain.id)
  const done = own.filter((t) => t.done).length
  const pct = own.length ? Math.round((done / own.length) * 100) : 0
  const overdue = own.filter((t) => !t.done && t.scheduled_on < today).length
  const upcoming = own.filter((t) => !t.done).sort((a, b) => a.scheduled_on.localeCompare(b.scheduled_on) || (a.start_time ?? '').localeCompare(b.start_time ?? '')).slice(0, 12)
  const recent = own.filter((t) => t.done).sort((a, b) => (b.done_at ?? '').localeCompare(a.done_at ?? '')).slice(0, 8)
  const domainGoals = goals.filter((g) => g.domain_id === domain.id)

  return (
    <>
      <Link to="/domains" className="mb-4 inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-muted transition hover:text-fg">
        <ArrowLeft className="size-4" aria-hidden />Tous les domaines
      </Link>
      <PageHeader title={domain.name} subtitle={`${domainGoals.length} objectif${domainGoals.length > 1 ? 's' : ''} · ${own.length} tâche${own.length > 1 ? 's' : ''}`}>
        <DomainTile domain={domain} size="lg" />
      </PageHeader>

      <div className="space-y-5">
        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-fg">Progression globale</p>
            <p className="text-sm font-semibold tabular-nums text-fg">{pct} %</p>
          </div>
          <ProgressBar value={pct} color={domain.color} tone={pct === 100 ? 'success' : 'brand'} />
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-surface-2/60 p-2.5"><p className="text-lg font-semibold tabular-nums text-fg">{done}</p><p className="text-[11px] text-muted">Terminées</p></div>
            <div className="rounded-xl bg-surface-2/60 p-2.5"><p className="text-lg font-semibold tabular-nums text-fg">{own.length - done}</p><p className="text-[11px] text-muted">À faire</p></div>
            <div className={overdue ? 'rounded-xl bg-rose-500/10 p-2.5' : 'rounded-xl bg-surface-2/60 p-2.5'}><p className={overdue ? 'text-lg font-semibold tabular-nums text-rose-600 dark:text-rose-400' : 'text-lg font-semibold tabular-nums text-fg'}>{overdue}</p><p className={overdue ? 'text-[11px] text-rose-600 dark:text-rose-400' : 'text-[11px] text-muted'}>En retard</p></div>
          </div>
        </Card>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted"><Target className="size-4" aria-hidden />Objectifs</h2>
          {domainGoals.length === 0 ? (
            <EmptyState icon={Target} title="Aucun objectif dans ce domaine" action={<Link to="/goals" className="inline-flex h-10 items-center rounded-xl btn-brand px-4 text-sm font-semibold">Créer un objectif</Link>}>Reliez vos tâches à un objectif pour suivre une direction claire.</EmptyState>
          ) : (
            <div className="space-y-2">
              {domainGoals.map((goal) => {
                const progress = goalProgress(goal, tasks)
                return (
                  <Card key={goal.id} className="space-y-2 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><p className="truncate text-sm font-semibold text-fg">{goal.title}</p>{goal.deadline && <p className="mt-0.5 flex items-center gap-1 text-xs text-muted"><CalendarClock className="size-3.5" aria-hidden />Date limite : {formatShort(goal.deadline)}</p>}</div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-fg">{progress.pct} %</span>
                    </div>
                    <ProgressBar value={progress.pct} color={domain.color} />
                    <p className="text-xs text-muted">{progress.done}/{progress.total} tâches</p>
                  </Card>
                )
              })}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted"><ListChecks className="size-4" aria-hidden />À venir</h2>
          {upcoming.length ? <ul className="space-y-2">{upcoming.map((task) => <TaskRow key={task.id} task={task} today={today} />)}</ul> : <p className="rounded-2xl border border-line bg-surface p-4 text-sm text-muted">Aucune tâche à venir.</p>}
        </section>

        {recent.length > 0 && (
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-muted"><CheckCircle2 className="size-4" aria-hidden />Dernières tâches terminées</h2>
            <ul className="space-y-2">{recent.map((task) => <TaskRow key={task.id} task={task} today={today} />)}</ul>
          </section>
        )}
      </div>
    </>
  )
}
