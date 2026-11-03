import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Flame, Plus } from 'lucide-react'
import Logo from './Logo.jsx'
import NotificationsMenu from './NotificationsMenu.jsx'
import QuickActionsModal from './QuickActionsModal.jsx'
import UserMenu from './UserMenu.jsx'
import { Badge } from '../ui/Badge.jsx'
import { DESKTOP_TOP, findNav } from './navigation.js'
import { useData } from '../../contexts/DataContext.jsx'
import { cn } from '../../lib/cn.js'

// Barre haute desktop : carte flottante, navigation principale, actions rapides,
// alertes et compte. Le rail vertical garde les pages d'analyse et le coach.
export default function DesktopHeader() {
  const { stats } = useData()
  const [quickOpen, setQuickOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-30 hidden px-5 pt-4 pb-2 lg:block">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 rounded-3xl border border-line bg-surface/90 px-3 shadow-card backdrop-blur-xl">
          <NavLink to="/dashboard" aria-label="Accueil FocusFlow" className="shrink-0 rounded-2xl px-1.5 py-1 transition hover:bg-surface-2">
            <Logo />
          </NavLink>

          <nav className="flex min-w-0 flex-1 items-center justify-center gap-1" aria-label="Navigation principale">
            {findNav(DESKTOP_TOP).map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) => cn(
                  'flex min-h-11 items-center gap-2 rounded-2xl px-2.5 text-[13px] font-semibold whitespace-nowrap transition xl:px-4 xl:text-sm',
                  isActive ? 'bg-brand-500/12 text-brand-700 dark:text-brand-300' : 'text-muted hover:bg-surface-2 hover:text-fg',
                )}>
                <Icon className="size-4.5" aria-hidden />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Badge tone="warning" icon={Flame} className="hidden xl:inline-flex">{stats.streak} j</Badge>
            <button type="button" onClick={() => setQuickOpen(true)} aria-label="Créer ou explorer"
              className="grid size-11 place-items-center rounded-2xl btn-brand shadow-sm transition active:scale-95">
              <Plus className="size-5" aria-hidden />
            </button>
            <NotificationsMenu />
            <UserMenu />
          </div>
        </div>
      </header>
      <QuickActionsModal open={quickOpen} onClose={() => setQuickOpen(false)} />
    </>
  )
}
