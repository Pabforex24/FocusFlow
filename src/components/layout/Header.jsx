import { Flame } from 'lucide-react'
import Logo from './Logo.jsx'
import NotificationsMenu from './NotificationsMenu.jsx'
import UserMenu from './UserMenu.jsx'
import { Badge } from '../ui/Badge.jsx'
import { useData } from '../../contexts/DataContext.jsx'
import { cn } from '../../lib/cn.js'

// Barre du haut mobile et tablette : carte flottante avec titre, série, alertes et compte.
// Le thème et les réglages restent dans le menu du compte.
// En paysage iPhone, elle passe à 48 px pour laisser de la hauteur au contenu.
export default function Header({ compact = false }) {
  const { stats } = useData()

  return (
    <header
      className={cn('sticky top-0 z-30 isolate', compact ? 'pb-1.5' : 'pb-2')}
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
      <div data-nav-zone className={cn(
        'relative mx-auto flex w-full max-w-[calc(64rem-2rem)] items-center justify-between gap-2 rounded-2xl border border-line bg-surface shadow-card',
        compact ? 'h-12 px-2.5' : 'h-14 px-3',
      )}>
        <Logo className="min-w-0" textClassName={compact ? 'text-base' : undefined} />
        <div className="flex shrink-0 items-center gap-2">
          <Badge tone="warning" icon={Flame} className="text-sm">{stats.streak} j</Badge>
          <NotificationsMenu />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
