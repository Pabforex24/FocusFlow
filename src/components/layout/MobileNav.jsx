import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Plus } from 'lucide-react'
import QuickActionsModal from './QuickActionsModal.jsx'
import { MOBILE_LEFT, MOBILE_RIGHT, findNav } from './navigation.js'
import { useNavAlerts } from '../../hooks/useNavAlerts.js'
import { cn } from '../../lib/cn.js'

function NotificationDot() {
  return (
    <span aria-hidden data-nav-badge
      className="absolute top-0 right-0 size-2.5 -translate-y-1/2 rounded-full bg-[#ef4444] ring-2 ring-surface" />
  )
}

function Tab({ to, label, short, icon: Icon, hasAlert }) {
  const accessibleName = hasAlert ? `${label}, notifications non lues` : label

  return (
    <NavLink to={to} aria-label={accessibleName}
      className={({ isActive }) => cn(
        'relative flex min-h-11 min-w-11 items-center justify-center rounded-[1.35rem] outline-none transition-[background-color,color,box-shadow,transform] duration-200 focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:scale-95',
        isActive
          ? 'flex-none gap-px bg-brand-400/20 px-0 text-[7.5px] font-semibold tracking-[-0.02em] whitespace-nowrap text-brand-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] ring-1 ring-brand-500/25 ring-inset dark:bg-brand-300/20 dark:text-brand-50 dark:ring-brand-200/20 min-[360px]:gap-1.5 min-[360px]:px-2 min-[360px]:text-[0.5625rem] min-[400px]:text-[0.625rem]'
          : 'flex-1 text-subtle hover:bg-surface-2/70 hover:text-fg',
      )}>
      {({ isActive }) => (
        <>
          <span className="relative grid shrink-0 place-items-center">
            <Icon aria-hidden
              className={isActive ? 'size-[18px] min-[360px]:size-5' : 'size-[22px] min-[360px]:size-6'} />
            {hasAlert && <NotificationDot />}
          </span>
          {isActive && <span>{short ?? label}</span>}
        </>
      )}
    </NavLink>
  )
}

// Même barre pour le téléphone et la tablette verticale : capsule en verre, bouton "+"
// central. Le Coach est accessible via son bouton flottant.
export default function MobileNav() {
  const [open, setOpen] = useState(false)
  const { unreadAlerts } = useNavAlerts()
  const badges = useMemo(() => {
    const counts = new Map()
    unreadAlerts.forEach((alert) => {
      const path = alert.to?.split('?')[0]
      if (path) counts.set(path, true)
    })
    return counts
  }, [unreadAlerts])

  return (
    <>
      <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-40 pb-safe">
        <div aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[calc(env(safe-area-inset-bottom,0px)+5.25rem)] bg-gradient-to-t from-bg/60 via-bg/30 to-transparent backdrop-blur-[2px]" />
        <div data-nav-zone
          className="nav-glass relative mx-auto mb-2 flex h-14 w-full max-w-md items-center gap-0 rounded-[1.65rem] min-[360px]:w-[calc(100%-0.5rem)] min-[360px]:gap-0.5 min-[360px]:px-1">
          {findNav(MOBILE_LEFT).map((item) => (
            <Tab key={item.to} {...item} hasAlert={badges.has(item.to)} />
          ))}
          <button type="button" data-nav-zone onClick={() => setOpen(true)} aria-label="Créer ou explorer"
            className="-translate-y-3 grid size-11 shrink-0 place-items-center rounded-[1.15rem] btn-brand shadow-lg shadow-brand-500/30 transition active:scale-95 min-[360px]:size-12">
            <Plus className="size-6" aria-hidden />
          </button>
          {findNav(MOBILE_RIGHT).map((item) => (
            <Tab key={item.to} {...item} hasAlert={badges.has(item.to)} />
          ))}
        </div>
      </nav>
      <QuickActionsModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
