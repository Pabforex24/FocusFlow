import { Link } from 'react-router-dom'
import { Award, ChevronRight, Flag, Flame, ListChecks, Plus, Target, TrendingUp, Trophy as TrophyIcon, Timer } from 'lucide-react'
import DomainTile from '../components/DomainTile.jsx'
import TaskItem from '../components/TaskItem.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Card, CardHeader } from '../components/ui/Card.jsx'
import { EmptyState } from '../components/ui/EmptyState.jsx'
import { ProgressBar, ProgressRing } from '../components/ui/ProgressBar.jsx'
import { StatCard } from '../components/ui/StatCard.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useData } from '../contexts/DataContext.jsx'
import { useFocus } from '../contexts/FocusContext.jsx'
import { addDays, diffDays, formatLong, formatShort, fromKey } from '../lib/dates.js'
import { challengeProgress } from '../lib/challenges.js'
import { resolveIcon } from '../lib/icons.js'
import { domainBreakdown, goalProgress, lastDays, rateBetween } from '../lib/stats.js'
import { cn } from '../lib/cn.js'

function greeting(name) {
  const h = new Date().getHours()
  const hello = h < 5 ? 'Bonne nuit' : h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir'
  return name ? `${hello}, ${name}` : hello
}

function dayMessage(total, left, streak) {
  if (total === 0) return "Aucune tâche prévue aujourd'hui : planifiez une action simple pour garder le rythme."
  if (left === 0) return 'Journée parfaite : toutes vos tâches sont faites.'
  if (streak >= 3) return `${left} tâche${left > 1 ? 's' : ''} à terminer pour prolonger votre série de ${streak} jours.`
  return `Il vous reste ${left} tâche${left > 1 ? 's' : ''} aujourd'hui. Une à la fois.`
}

export default function Dashboard() {
  const { user } = useAuth()
  const { profile, tasks, goals, domains, activeChallenges, badges, stats, today } = useData()
  const { openPicker } = useFocus()

  const todayTasks = tasks.filter((t) => t.scheduled_on === today).sort((a, b) => Number(a.done) - Number(b.done) || a.created_at.localeCompare(b.created_at))
  const done = todayTasks.filter((t) => t.done).length
  const left = todayTasks.length - done
  const pct = todayTasks.length ? Math.round((done / todayTasks.length) * 100) : 0
  const name = profile?.display_name || user?.email?.split('@')[0]

  const week = lastDays(tasks, today)
  const weekRate = rateBetween(tasks, addDays(today, -6), today)
  const prevRate = rateBetween(tasks, addDays(today, -13), addDays(today, -7))
  const trend = weekRate !== null && prevRate !== null
    ? { value: `${weekRate - prevRate >= 0 ? '+' : ''}${weekRate - prevRate} pts`, direction: weekRate > prevRate ? 'up' : weekRate < prevRate ? 'down' : 'flat' }
    : undefined

  const runningChallenges = activeChallenges.filter((a) => a.end_date >= today).slice(0, 2)
  const priorityGoals = goals
    .map((g) => ({ goal: g, progress: goalProgress(g, tasks) }))
    .filter(({ progress }) => !(progress.total > 0 && progress.pct === 100))
    .sort((a, b) => (a.goal.deadline ?? '9999') .localeCompare(b.goal.deadline ?? '9999') || b.progress.pct - a.progress.pct)
    .slice(0, 3)
  const byDomain = domainBreakdown(domains, todayTasks).filter((x) => x.total > 0)
  const unlocked = badges.filter((b) => b.unlocked).length

  return (
    <div className="space-y-6">
      {/* En-tête d'accueil */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-600 via-brand-700 to-brand-900 p-5 text-white shadow-pop sm:p-7">
        <div className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="relative flex items-center justify-between gap-5">
          <div className="min-w-0">
            <p className="text-sm text-white/70 first-letter:uppercase">{formatLong(today)}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight break-words sm:text-3xl">{greeting(name)}</h1>
            <p className="mt-2 max-w-md text-sm text-white/80">{dayMessage(todayTasks.length, left, stats.streak)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/tasks?new=1" className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-brand-700 transition hover:bg-white/90 active:scale-[0.97]"><Plus className="size-4" aria-hidden />Nouvelle tâche</Link>
              <button type="button" onClick={() => openPicker()} className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/15 px-4 text-sm font-semibold text-white transition hover:bg-white/25 active:scale-[0.97]"><Timer className="size-4" aria-hidden />Session Focus</button>
            </div>
          </div>
          <div className="hidden shrink-0 sm:block">
            <div className="grid size-28 place-items-center rounded-full bg-white/10">
              <ProgressRing value={pct} size={96} stroke={9} tone={pct === 100 ? 'success' : 'brand'}>
                <span className="text-xl font-bold text-white">{pct}%</span>
              </ProgressRing>
            </div>
          </div>
        </div>
        <div className="relative mt-5 sm:hidden">
          <div className="mb-1.5 flex justify-between text-xs text-white/75"><span>Progression du jour</span><span className="tabular-nums">{done}/{todayTasks.length}</span></div>
          <ProgressBar value={pct} size="sm" className="bg-white/20" color="#ffffff" />
        </div>
      </section>

      {/* Statistiques clés */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Statistiques clés">
        <StatCard icon={ListChecks} tone="brand" label="Tâches du jour" value={`${done}/${todayTasks.length}`} hint={left > 0 ? `${left} restante${left > 1 ? 's' : ''}` : todayTasks.length ? 'Tout est fait' : 'Rien de prévu'} />
        <StatCard icon={Flame} tone="warning" label="Série en cours" value={`${stats.streak} j`} hint={`Record : ${stats.longestStreak} j`} />
        <StatCard icon={TrophyIcon} tone="info" label={`Niveau ${stats.level}`} value={`${stats.xp} XP`} hint={`${stats.xpForNext - stats.xpIntoLevel} XP avant le niveau ${stats.level + 1}`} />
        <StatCard icon={TrendingUp} tone="success" label="Réussite sur 7 jours" value={weekRate === null ? '—' : `${weekRate} %`} trend={trend} hint={weekRate === null ? 'Pas encore de données' : 'vs semaine précédente'} />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Tâches du jour */}
          <section aria-label="Tâches du jour">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-fg">Aujourd'hui</h2>
              <Link to="/tasks" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline dark:text-brand-300">Tout voir<ChevronRight className="size-4" aria-hidden /></Link>
            </div>
            {todayTasks.length === 0 ? (
              <EmptyState icon={ListChecks} title="Rien de prévu aujourd'hui" action={<Link to="/tasks?new=1" className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-500"><Plus className="size-4" aria-hidden />Ajouter une tâche</Link>}>
                Planifiez une action simple pour avancer vers vos objectifs.
              </EmptyState>
            ) : (
              <div className="space-y-2.5">
                {todayTasks.slice(0, 6).map((t) => <TaskItem key={t.id} task={t} compact />)}
                {todayTasks.length > 6 && <Link to="/tasks" className="block rounded-xl py-2 text-center text-sm font-medium text-muted hover:bg-surface-2">+ {todayTasks.length - 6} autre{todayTasks.length - 6 > 1 ? 's' : ''} tâche{todayTasks.length - 6 > 1 ? 's' : ''}</Link>}
              </div>
            )}
          </section>

          {/* Activité 7 jours */}
          <Card>
            <CardHeader icon={TrendingUp} title="Activité des 7 derniers jours" description={weekRate === null ? 'Aucune tâche sur la période' : `${weekRate} % de tâches terminées`} />
            <div className="flex items-end gap-2 sm:gap-3" role="img" aria-label="Taux de complétion par jour sur 7 jours">
              {week.map((d) => {
                const isToday = d.key === today
                return (
                  <div key={d.key} className="flex flex-1 flex-col items-center gap-2" title={`${formatShort(d.key)} : ${d.done}/${d.total}`}>
                    <div className="flex h-28 w-full items-end overflow-hidden rounded-xl bg-surface-2">
                      <div className={cn('w-full rounded-xl transition-[height] duration-700', d.rate === 1 ? 'bg-emerald-500' : 'bg-brand-500')} style={{ height: `${d.total ? Math.max(8, (d.rate ?? 0) * 100) : 0}%` }} />
                    </div>
                    <span className={cn('text-xs font-medium', isToday ? 'text-brand-600 dark:text-brand-300' : 'text-subtle')}>{fromKey(d.key).toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3)}</span>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Challenges en cours */}
          <Card>
            <CardHeader icon={Flag} title="Challenge en cours" action={<Link to="/challenges" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-300">Voir</Link>} />
            {runningChallenges.length === 0 ? (
              <p className="text-sm text-muted">Aucun challenge actif. <Link to="/challenges" className="font-medium text-brand-600 hover:underline dark:text-brand-300">En démarrer un</Link></p>
            ) : (
              <div className="space-y-4">
                {runningChallenges.map((a) => {
                  const p = challengeProgress(a, tasks)
                  const remaining = Math.max(0, diffDays(today, a.end_date))
                  return (
                    <div key={a.id} className="flex items-center gap-3">
                      <ProgressRing value={p.pct} size={56} stroke={6} />
                      <div className="min-w-0"><p className="truncate text-sm font-semibold text-fg">{a.title}</p><p className="text-xs text-muted">{p.done}/{p.total} tâches · {remaining} j restants</p></div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Objectifs prioritaires */}
          <Card>
            <CardHeader icon={Target} title="Objectifs prioritaires" action={<Link to="/goals" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-300">Voir</Link>} />
            {priorityGoals.length === 0 ? (
              <p className="text-sm text-muted">Aucun objectif en cours. <Link to="/goals?new=1" className="font-medium text-brand-600 hover:underline dark:text-brand-300">En créer un</Link></p>
            ) : (
              <div className="space-y-4">
                {priorityGoals.map(({ goal, progress }) => {
                  const domain = domains.find((d) => d.id === goal.domain_id)
                  return (
                    <div key={goal.id} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="min-w-0 truncate text-sm font-medium text-fg">{goal.title}</p>
                        <span className="text-xs font-semibold tabular-nums text-muted">{progress.pct} %</span>
                      </div>
                      <ProgressBar value={progress.pct} color={domain?.color} size="sm" />
                      {goal.deadline && <p className="text-xs text-subtle">Échéance {formatShort(goal.deadline)}</p>}
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Domaines du jour */}
          {byDomain.length > 0 && (
            <Card>
              <CardHeader title="Domaines aujourd'hui" />
              <div className="space-y-3.5">
                {byDomain.map(({ domain, done: d, total, pct: p }) => (
                  <div key={domain.id} className="flex items-center gap-3">
                    <DomainTile domain={domain} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex justify-between text-sm"><span className="truncate font-medium text-fg">{domain.name}</span><span className="tabular-nums text-muted">{d}/{total}</span></div>
                      <ProgressBar value={p} color={domain.color} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Badges */}
      <Card>
        <CardHeader icon={Award} title="Badges" description={`${unlocked} débloqué${unlocked > 1 ? 's' : ''} sur ${badges.length}`} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {badges.map((b) => {
            const Icon = resolveIcon(b.icon)
            return (
              <div key={b.id} title={b.description} className={cn('flex flex-col items-center gap-1.5 rounded-2xl border border-line p-3 text-center transition', b.unlocked ? 'bg-surface' : 'bg-surface-2/50 opacity-55')}>
                <span className={cn('grid size-11 place-items-center rounded-xl', b.unlocked ? 'bg-amber-500/12 text-amber-600 dark:text-amber-400' : 'bg-surface-2 text-subtle')}><Icon className="size-5" aria-hidden /></span>
                <p className="text-xs leading-tight font-semibold text-fg">{b.title}</p>
                {b.unlocked ? <Badge tone="success">Débloqué</Badge> : <p className="text-[11px] leading-tight text-subtle">{b.description}</p>}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
