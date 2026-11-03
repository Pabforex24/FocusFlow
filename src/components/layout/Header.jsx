import { Flame } from 'lucide-react'
import Logo from './Logo.jsx'
import NotificationsMenu from './NotificationsMenu.jsx'
import UserMenu from './UserMenu.jsx'
import { Badge } from '../ui/Badge.jsx'
import { useData } from '../../contexts/DataContext.jsx'

// Barre du haut mobile et tablette : titre, série, alertes et compte.
// Le thème et les réglages restent dans le menu du compte.
export default function Header() {
  const { stats } = useData()

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 pt-safe backdrop-blur-lg lg:hidden">
      <div className="flex h-14 items-center justify-between gap-2 px-4">
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
