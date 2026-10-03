import { Flame, LogOut, Monitor, Moon, RefreshCw, ShieldAlert, Sun, Trophy } from 'lucide-react'
import { Button } from '../components/ui/Button.jsx'
import { Card, CardHeader } from '../components/ui/Card.jsx'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { ProgressBar } from '../components/ui/ProgressBar.jsx'
import { Segmented } from '../components/ui/Segmented.jsx'
import { Switch } from '../components/ui/Switch.jsx'
import { useSignOut } from '../components/Layout.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useData } from '../contexts/DataContext.jsx'
import { useTheme } from '../contexts/ThemeContext.jsx'

export default function Profile() {
  const { user } = useAuth()
  const { profile, stats, actions } = useData()
  const { preference, setTheme } = useTheme()
  const signOut = useSignOut()
  const hardcore = profile?.hardcore_mode ?? false
  const name = profile?.display_name || user.email
  const initials = name.slice(0, 2).toUpperCase()

  return (
    <>
      <PageHeader title="Profil" />
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
            <ProgressBar value={(stats.xpIntoLevel / stats.xpForNext) * 100} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { icon: Trophy, value: stats.totalDone, label: 'Tâches faites' },
              { icon: Flame, value: stats.streak, label: 'Série (jours)' },
              { icon: Flame, value: stats.longestStreak, label: 'Record' },
            ].map(({ icon: Icon, value, label }, i) => (
              <div key={i} className="rounded-xl bg-surface-2 px-2 py-3"><Icon className="mx-auto mb-1 size-4 text-brand-600 dark:text-brand-300" aria-hidden /><p className="text-lg font-bold tabular-nums text-fg">{value}</p><p className="text-[11px] text-muted">{label}</p></div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Apparence" description="Choisissez le thème de l'application" />
          <Segmented fill value={preference} onChange={setTheme} options={[{ value: 'light', label: 'Clair', icon: Sun }, { value: 'dark', label: 'Sombre', icon: Moon }, { value: 'system', label: 'Auto', icon: Monitor }]} />
        </Card>

        <Card className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400"><ShieldAlert className="size-5" aria-hidden /></span>
            <div><p className="text-sm font-semibold text-fg">Mode Hardcore</p><p className="text-sm text-muted">Un jour sans tâche faite coûte −30 XP au lieu de −15.</p></div>
          </div>
          <Switch checked={hardcore} onChange={actions.setHardcore} label="Mode Hardcore" />
        </Card>

        <Card className="flex items-center justify-between gap-4">
          <div><p className="text-sm font-semibold text-fg">Actualiser les données</p><p className="text-sm text-muted">Recharge tout depuis le serveur.</p></div>
          <Button variant="secondary" icon={RefreshCw} onClick={() => actions.refresh()}>Actualiser</Button>
        </Card>

        <Button variant="danger-soft" className="w-full border border-rose-500/30" icon={LogOut} onClick={signOut}>Se déconnecter</Button>
      </div>
    </>
  )
}
