import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Plus } from 'lucide-react'
import Logo from './Logo.jsx'
import NotificationsMenu from './NotificationsMenu.jsx'
import QuickActionsModal from './QuickActionsModal.jsx'
import UserMenu from './UserMenu.jsx'
import { MOBILE_LEFT, MOBILE_RIGHT, findNav } from './navigation.js'
import { cn } from '../../lib/cn.js'

const COMPACT_ITEMS = [...MOBILE_LEFT, ...MOBILE_RIGHT]

// Téléphone en paysage : rail vertical fin et lisible au toucher, capsule réduite
// en haut à droite. Pas de barre en bas, pour préserver la hauteur utile.
export default function CompactNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <aside
        className="fixed top-1/2 z-40 -translate-y-1/2"
        style={{ left: 'calc(env(safe-area-inset-left, 0px) + 0.5rem)' }}
      >
        <nav aria-label="Navigation principale" data-nav-zone
          className="flex w-[4.25rem] flex-col gap-0.5 rounded-2xl border border-line bg-surface/95 p-1.5 shadow-card backdrop-blur-xl">
          {findNav(COMPACT_ITEMS).map(({ to, label, short, icon: Icon }) => (
            <NavLink key={to} to={to} title={label} aria-label={label}
              className={({ isActive }) => cn(
                'flex min-h-11 w-full flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[8px] leading-none font-medium transition-colors',
                isActive ? 'bg-brand-500/14 text-brand-700 dark:text-brand-300' : 'text-subtle hover:bg-surface-2 hover:text-fg',
              )}>
              <Icon className="size-[18px]" aria-hidden />
              <span className="w-full truncate text-center">{short ?? label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div
        data-nav-zone
        className="fixed z-40 flex items-center gap-1 rounded-2xl border border-line bg-surface p-1.5 shadow-card"
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)',
          right: 'calc(env(safe-area-inset-right, 0px) + 0.5rem)',
        }}
      >
        <Link to="/dashboard" aria-label="Accueil FocusFlow" className="rounded-xl px-1.5 py-1 transition hover:bg-surface-2">
          <Logo textClassName="text-base" />
        </Link>
        <button type="button" onClick={() => setOpen(true)} aria-label="Créer ou explorer"
          className="grid size-11 shrink-0 place-items-center rounded-xl btn-brand shadow-sm transition active:scale-95">
          <Plus className="size-5" aria-hidden />
        </button>
        <NotificationsMenu buttonClassName="border-transparent bg-transparent" />
        <UserMenu buttonClassName="border-transparent bg-transparent" />
      </div>

      <QuickActionsModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
