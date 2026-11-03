import { Flame } from 'lucide-react'
import Logo from './Logo.jsx'
import NotificationsMenu from './NotificationsMenu.jsx'
import UserMenu from './UserMenu.jsx'
import { Badge } from '../ui/Badge.jsx'
import { useData } from '../../contexts/DataContext.jsx'

// Barre du haut mobile et tablette : carte flottante avec titre, série, alertes et compte.
// Le thème et les réglages restent dans le menu du compte.
export default function Header() {
  const { stats } = useData()

  return (
    <header
      className="sticky top-0 z-30 isolate pb-2"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)',
        paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 1rem)',
        paddingRight: 'calc(env(safe-area-inset-right, 0px) + 1rem)',
      }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-bg"
        style={{
          maskImage: 'linear-gradient(to bottom, #000 calc(100% - 10px), transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 calc(100% - 10px), transparent)',
        }} />
      <div data-nav-zone className="relative mx-auto flex h-14 w-full max-w-[calc(64rem-2rem)] items-center justify-between gap-2 rounded-2xl border border-line bg-surface px-3 shadow-card">
        <Logo className="min-w-0" />
        <div className="flex shrink-0 items-center gap-2">
          <Badge tone="warning" icon={Flame} className="text-sm">{stats.streak} j</Badge>
          <NotificationsMenu />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
