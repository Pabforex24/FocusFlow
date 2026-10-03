import { Flame } from 'lucide-react'
import Logo from './Logo.jsx'
import ThemeToggle from '../ThemeToggle.jsx'
import { Badge } from '../ui/Badge.jsx'
import { useData } from '../../contexts/DataContext.jsx'

// Barre du haut, mobile uniquement (sur tablette/desktop, la sidebar prend le relais).
export default function Header() {
  const { stats } = useData()
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 pt-safe backdrop-blur-lg md:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Logo />
        <div className="flex items-center gap-1">
          <Badge tone="warning" icon={Flame} className="text-sm">{stats.streak} j</Badge>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
