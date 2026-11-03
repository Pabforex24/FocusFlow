import { NavLink } from 'react-router-dom'
import ThemeToggle from '../ThemeToggle.jsx'
import { ProgressBar } from '../ui/ProgressBar.jsx'
import { DESKTOP_RAIL, findNav } from './navigation.js'
import { useData } from '../../contexts/DataContext.jsx'
import { cn } from '../../lib/cn.js'

// Rail desktop : une seule carte flottante regroupe navigation secondaire, thème
// et niveau. Les libellés apparaissent au survol et au focus clavier.
export default function DesktopRail() {
  const { stats } = useData()

  return (
    <aside className="fixed top-24 left-3 z-40 w-[4.5rem]">
      <div className="flex flex-col items-center gap-1 rounded-3xl border border-line bg-surface/90 p-2 shadow-card backdrop-blur-xl">
        <nav className="flex flex-col gap-1" aria-label="Navigation secondaire">
          {findNav(DESKTOP_RAIL).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} title={label} aria-label={label}
              className={({ isActive }) => cn(
                'group relative grid size-11 place-items-center rounded-2xl transition active:scale-95',
                isActive ? 'bg-brand-500 text-brand-950 shadow-sm' : 'text-muted hover:bg-surface-2 hover:text-fg',
              )}>
              <Icon className="size-5" aria-hidden />
              <span className="pointer-events-none absolute top-1/2 left-full z-10 ml-2 -translate-y-1/2 rounded-lg border border-line bg-surface px-2 py-1 text-xs font-medium whitespace-nowrap text-fg opacity-0 shadow-card transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                {label}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="my-1 h-px w-8 bg-line" />

        <ThemeToggle className="size-11 sm:size-11" />

        <div className="w-full rounded-2xl bg-surface-2/60 p-2 text-center">
          <p className="text-[10px] font-semibold text-fg">Niv. {stats.level}</p>
          <ProgressBar className="mt-1.5" size="sm" value={(stats.xpIntoLevel / stats.xpForNext) * 100} />
          <p className="mt-1 text-[9px] text-subtle tabular-nums">{stats.xpIntoLevel}/{stats.xpForNext}</p>
        </div>
      </div>
    </aside>
  )
}
