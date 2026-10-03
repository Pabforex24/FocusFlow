import { NavLink, useNavigate } from 'react-router-dom'
import { Flame, Plus } from 'lucide-react'
import Logo from './Logo.jsx'
import ThemeToggle from '../ThemeToggle.jsx'
import { Button, IconButton } from '../ui/Button.jsx'
import { ProgressBar } from '../ui/ProgressBar.jsx'
import { NAV_ITEMS } from './navigation.js'
import { useData } from '../../contexts/DataContext.jsx'
import { cn } from '../../lib/cn.js'

// Tablette (md) : rail d'icônes. Desktop (lg) : barre complète avec libellés.
export default function Sidebar() {
  const { stats } = useData()
  const navigate = useNavigate()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[4.5rem] flex-col border-r border-line bg-surface px-3 py-5 md:flex lg:w-64 lg:px-4">
      <Logo showText={false} className="mb-6 justify-center lg:hidden" />
      <Logo className="mb-6 hidden px-2 lg:flex" />

      <Button className="mb-5 hidden lg:inline-flex" icon={Plus} onClick={() => navigate('/tasks?new=1')}>Nouvelle tâche</Button>
      <IconButton className="mb-5 self-center bg-brand-600 text-white hover:bg-brand-500 hover:text-white lg:hidden" icon={Plus} label="Nouvelle tâche" onClick={() => navigate('/tasks?new=1')} />

      <nav className="flex flex-1 flex-col gap-1" aria-label="Navigation principale">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} title={label} aria-label={label}
            className={({ isActive }) => cn(
              'relative flex items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors lg:justify-start',
              isActive ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300' : 'text-muted hover:bg-surface-2 hover:text-fg',
            )}>
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-500" aria-hidden />}
                <Icon className="size-5 shrink-0" aria-hidden />
                <span className="hidden lg:inline">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 space-y-3">
        <div className="hidden rounded-2xl border border-line bg-surface-2/60 p-3 lg:block">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-fg">Niveau {stats.level}</span>
            <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400"><Flame className="size-4" aria-hidden />{stats.streak}</span>
          </div>
          <ProgressBar className="mt-2" size="sm" value={(stats.xpIntoLevel / stats.xpForNext) * 100} />
          <p className="mt-1.5 text-xs text-subtle">{stats.xpIntoLevel} / {stats.xpForNext} XP</p>
        </div>
        <div className="flex justify-center lg:justify-end"><ThemeToggle /></div>
      </div>
    </aside>
  )
}
