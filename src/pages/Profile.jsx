import { Link } from 'react-router-dom'
import { Award, Flame, Settings, Timer, Trophy } from 'lucide-react'
import { Card } from '../components/ui/Card.jsx'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { ProgressBar } from '../components/ui/ProgressBar.jsx'
import { StatCard } from '../components/ui/StatCard.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useData } from '../contexts/DataContext.jsx'

export default function Profile() {
  const { user } = useAuth()
  const { profile, stats } = useData()
  const name = profile?.display_name || user.email
  const initials = name.slice(0, 2).toUpperCase()
  const progress = stats.xpForNext > 0 ? (stats.xpIntoLevel / stats.xpForNext) * 100 : 0

  return (
    <>
      <PageHeader title="Mon profil" subtitle="Tes informations et ta progression.">
        <Link to="/settings" className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-fg shadow-xs transition hover:bg-surface-2 dark:bg-white/5 dark:hover:bg-white/10">
          <Settings className="size-4" aria-hidden /> Réglages
        </Link>
      </PageHeader>
      <div className="mx-auto max-w-2xl space-y-4">
        <Card className="space-y-5">
          <div className="flex items-center gap-4">
            <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-brand-300 to-brand-500 font-display text-xl font-bold text-brand-950">{initials}</span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-fg">{name}</h2>
              <p className="truncate text-sm text-muted">{user.email}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm"><span className="font-semibold text-fg">Niveau {stats.level}</span><span className="tabular-nums text-muted">{stats.xpIntoLevel} / {stats.xpForNext} XP</span></div>
            <ProgressBar value={progress} />
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Trophy} label="Tâches faites" value={stats.totalDone} />
          <StatCard icon={Flame} label="Série actuelle" value={`${stats.streak} j`} hint={`Record : ${stats.longestStreak} j`} tone="warning" />
          <StatCard icon={Timer} label="Sessions Focus" value={stats.focusCount} tone="info" />
          <StatCard icon={Award} label="Défis terminés" value={stats.challengesDone} tone="success" />
        </div>
      </div>
    </>
  )
}
