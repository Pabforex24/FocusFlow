import { Link } from 'react-router-dom'
import { Bell, Flame } from 'lucide-react'
import Logo from './Logo.jsx'
import { Badge } from '../ui/Badge.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useData } from '../../contexts/DataContext.jsx'

const iconButton = 'grid size-9 shrink-0 place-items-center rounded-full border border-line bg-surface/70 text-muted transition hover:text-fg active:scale-95 min-[380px]:size-10'

// Barre du haut, mobile uniquement (sur tablette/desktop, la sidebar prend le relais).
// Logo à gauche ; série, notifications et profil à droite. Le thème clair/sombre se règle dans Profil > Apparence.
export default function Header() {
  const { user } = useAuth()
  const { profile, stats } = useData()
  const name = profile?.display_name || user?.email || 'FocusFlow'
  const initials = name.slice(0, 2).toUpperCase()

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 pt-safe backdrop-blur-lg md:hidden">
      <div className="flex h-14 items-center justify-between gap-2 px-4">
        <Logo className="min-w-0" />
        <div className="flex shrink-0 items-center gap-2">
          <Badge tone="warning" icon={Flame} className="text-sm">{stats.streak} j</Badge>
          {/* Pas de système de notifications dédié : la cloche mène aux conseils du coach. */}
          <Link to="/coach" aria-label="Notifications et conseils du coach" className={iconButton}><Bell className="size-5" aria-hidden /></Link>
          <Link to="/profile" aria-label="Mon profil" className="grid size-9 shrink-0 place-items-center rounded-full bg-linear-to-br from-brand-300 to-brand-500 font-display text-xs font-bold text-brand-950 ring-2 ring-brand-500/40 transition active:scale-95 min-[380px]:size-10 min-[380px]:text-sm">{initials}</Link>
        </div>
      </div>
    </header>
  )
}
