import { NavLink, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { LogoLink } from './Logo.jsx'
import ThemeToggle from '../ThemeToggle.jsx'
import { IconButton } from '../ui/Button.jsx'
import { NAV_ITEMS } from './navigation.js'
import { cn } from '../../lib/cn.js'

// Tablette (md → lg) : rail d'icônes. Le desktop utilise DesktopHeader + DesktopRail.
export default function Sidebar() {
  const navigate = useNavigate()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[4.5rem] flex-col border-r border-line bg-surface px-3 py-5 md:flex lg:hidden dark:bg-surface/80 dark:backdrop-blur-xl">
      <LogoLink showText={false} className="mb-6 justify-center" />

      <IconButton className="mb-5 self-center btn-brand hover:text-brand-950" icon={Plus} label="Nouvelle tâche" onClick={() => navigate('/tasks?new=1')} />

      <nav className="flex flex-1 flex-col gap-1" aria-label="Navigation principale">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} title={label} aria-label={label}
            className={({ isActive }) => cn(
              'relative flex min-h-11 items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              isActive ? 'bg-linear-to-r from-brand-400/15 to-transparent text-brand-700 ring-1 ring-line dark:text-brand-300' : 'text-muted hover:bg-surface-2 hover:text-fg',
            )}>
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-400 shadow-[0_0_8px_rgb(var(--accent-soft-rgb)/0.6)]" aria-hidden />}
                <Icon className="size-5 shrink-0" aria-hidden />
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-3 flex flex-col items-center gap-2">
        <ThemeToggle />
      </div>
    </aside>
  )
}
