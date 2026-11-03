import { NavLink } from 'react-router-dom'
import ThemeToggle from '../ThemeToggle.jsx'
import { ProgressBar } from '../ui/ProgressBar.jsx'
import { DESKTOP_RAIL, findNav } from './navigation.js'
import { useData } from '../../contexts/DataContext.jsx'
import { cn } from '../../lib/cn.js'

// Rail desktop : les pages d'analyse et le coach restent à gauche, avec le thème
// et la progression en bas. Les libellés sont exposés via title + sr-only.
export default function DesktopRail() {
  const { stats } = useData()

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[5.5rem] flex-col items-center py-4 lg:flex">
      <nav className="mt-20 flex flex-col gap-1 rounded-3xl border border-line bg-surface/90 p-2 shadow-card backdrop-blur-xl" aria-label="Navigation secondaire">
        {findNav(DESKTOP_RAIL).map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} title={label} aria-label={label}
            className={({ isActive }) => cn(
              'grid size-11 place-items-center rounded-2xl transition active:scale-95',
              isActive ? 'bg-brand-500 text-brand-950 shadow-sm' : 'text-muted hover:bg-surface-2 hover:text-fg',
            )}>
            <Icon className="size-5" aria-hidden />
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto mb-2 flex flex-col items-center gap-2">
        <div className="rounded-3xl border border-line bg-surface/90 p-1.5 shadow-card backdrop-blur-xl"><ThemeToggle /></div>
        <div className="w-[4.1rem] rounded-3xl border border-line bg-surface/90 p-2 text-center shadow-card backdrop-blur-xl">
          <p className="text-[10px] font-semibold text-fg">Niv. {stats.level}</p>
          <ProgressBar className="mt-1.5" size="sm" value={(stats.xpIntoLevel / stats.xpForNext) * 100} />
          <p className="mt-1 text-[9px] text-subtle tabular-nums">{stats.xpIntoLevel}/{stats.xpForNext}</p>
        </div>
      </div>
    </aside>
  )
}
