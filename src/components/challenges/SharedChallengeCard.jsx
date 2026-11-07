import { useEffect, useState } from 'react'
import { Archive, CalendarClock, Copy, Flag, LogOut, Share2, Trophy, Users } from 'lucide-react'
import DomainTile from '../DomainTile.jsx'
import { Badge } from '../ui/Badge.jsx'
import { Button } from '../ui/Button.jsx'
import { Card } from '../ui/Card.jsx'
import { ProgressBar } from '../ui/ProgressBar.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useData } from '../../contexts/DataContext.jsx'
import { useToast } from '../../contexts/ToastContext.jsx'
import { blueprintDurationLabel, challengeProgress } from '../../lib/challenges.js'
import { cn } from '../../lib/cn.js'
import { formatShort } from '../../lib/dates.js'
import { sharedChallengeLink, sharedChallengeStatus, sharedChallengeTotals } from '../../lib/sharedChallenges.js'

const statusBadge = (status, group) => {
  if (status === 'archived') return <Badge tone="neutral" icon={Archive}>Archivé</Badge>
  if (status === 'upcoming') return <Badge tone="info" icon={CalendarClock}>Commence le {formatShort(group.start_date)}</Badge>
  if (status === 'finished') return <Badge tone="neutral" icon={Flag}>Terminé</Badge>
  return <Badge tone="success">En cours</Badge>
}

export default function SharedChallengeCard({ group, active, tasks, members, onLeave, onArchive }) {
  const { user } = useAuth()
  const { actions, today } = useData()
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const isOwner = group.owner_id === user?.id
  const status = sharedChallengeStatus(group, today)
  const progress = active ? challengeProgress(active, tasks) : { done: 0, total: 0, pct: 0 }
  const totals = sharedChallengeTotals(rows)
  const myDone = active ? tasks.filter((task) => task.challenge_active_id === active.id && task.done).length : 0

  useEffect(() => {
    let cancelled = false
    let timer
    const load = async () => {
      try {
        const next = await actions.getSharedLeaderboard(group.id)
        if (cancelled) return
        setRows(Array.isArray(next) ? next : [])
        setLoadError(false)
      } catch {
        if (!cancelled) setLoadError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    timer = setInterval(load, 30_000)
    const onVisible = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [actions, group.id, myDone])

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(group.join_code)
      toast.success('Code d\'invitation copié')
    } catch {
      toast.error(`Impossible de copier le code. Code : ${group.join_code}`)
    }
  }

  const invite = async () => {
    const link = sharedChallengeLink(group.join_code)
    try {
      await navigator.clipboard.writeText(link)
      toast.success('Lien d\'invitation copié')
    } catch {
      toast.error(`Impossible de copier le lien. Code : ${group.join_code}`)
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <DomainTile iconName={group.icon} color={group.color} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="truncate text-base font-semibold text-fg">{group.title}</h3>
              {isOwner && <Badge tone="brand">Organisateur</Badge>}
            </div>
            <p className="text-sm text-muted">{formatShort(group.start_date)} → {formatShort(group.end_date)}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {statusBadge(status, group)}
              <Badge tone="neutral" icon={Users}>{members.length} participant{members.length > 1 ? 's' : ''}</Badge>
            </div>
          </div>
        </div>
        <button type="button" onClick={copyCode} title="Copier le code d'invitation" aria-label={`Copier le code d'invitation ${group.join_code}`}
          className="group/code inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg bg-surface-2 px-2 py-1 font-mono text-[11px] font-semibold tracking-wider text-muted transition hover:bg-brand-500/10 hover:text-brand-600 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none dark:hover:text-brand-300">
          {group.join_code}
          <Copy className="size-3.5 opacity-60 transition group-hover/code:opacity-100" aria-hidden />
        </button>
      </div>

      {group.description && <p className="text-sm text-muted">{group.description}</p>}

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl bg-surface-2 px-3 py-2.5">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Ma progression</span><span className="tabular-nums">{progress.done}/{progress.total}</span>
          </div>
          <div className="mt-1.5"><ProgressBar value={progress.pct} color={group.color} size="sm" /></div>
        </div>
        <div className="rounded-xl bg-surface-2 px-3 py-2.5">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Progressions du groupe</span><span className="tabular-nums">{totals.pct}%</span>
          </div>
          <div className="mt-1.5"><ProgressBar value={totals.pct} size="sm" /></div>
        </div>
      </div>

      <div className="space-y-2 border-t border-line pt-3">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-fg"><Trophy className="size-4 text-amber-500" aria-hidden />Classement</p>
          {status !== 'archived' && (
            <button type="button" onClick={invite} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-brand-600 hover:bg-brand-500/10 dark:text-brand-300">
              <Share2 className="size-3.5" aria-hidden />Inviter
            </button>
          )}
        </div>
        {loading && rows.length === 0 ? (
          <p className="text-xs text-muted">Chargement du classement…</p>
        ) : rows.length === 0 ? (
          <p className="text-xs text-muted">Aucune progression à afficher pour le moment.</p>
        ) : (
          <ul className="space-y-1">
            {rows.map((row, index) => (
              <li key={row.user_id} className={cn('flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm', row.me && 'bg-brand-500/10')}>
                <span className="w-5 shrink-0 text-center text-xs font-bold tabular-nums text-subtle">{index + 1}</span>
                <span className="min-w-0 flex-1 truncate font-medium text-fg">{row.name}{row.me ? ' (vous)' : ''}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted">{row.done}/{row.total}</span>
                <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums text-fg">{row.pct}%</span>
              </li>
            ))}
          </ul>
        )}
        {loadError && <p className="text-xs text-rose-600 dark:text-rose-400">Classement indisponible pour le moment. Réessayez plus tard.</p>}
      </div>

      <details className="border-t border-line pt-3">
        <summary className="cursor-pointer text-sm font-semibold text-fg">Programme commun</summary>
        <ul className="mt-2 space-y-1.5 text-sm text-muted">
          {group.blueprints.map((blueprint, index) => (
            <li key={index} className="flex items-start gap-2">
              <Flag className="mt-0.5 size-3.5 shrink-0 text-subtle" aria-hidden />
              <span>{blueprint.title}{blueprintDurationLabel(blueprint) ? ` · ${blueprintDurationLabel(blueprint)}` : ''}</span>
            </li>
          ))}
        </ul>
      </details>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <p className="text-xs text-muted">
          {status === 'archived' ? 'Ce défi est archivé.' : status === 'finished' ? 'Le défi est terminé.' : 'Même programme pour tous, tâches personnelles.'}
        </p>
        <div className="flex flex-wrap gap-2">
          {!isOwner && status !== 'archived' && (
            <Button variant="danger-soft" size="sm" icon={LogOut} onClick={onLeave}>Quitter</Button>
          )}
          {isOwner && status !== 'archived' && (
            <Button variant="secondary" size="sm" icon={Archive} onClick={onArchive}>Archiver</Button>
          )}
        </div>
      </div>
    </Card>
  )
}
