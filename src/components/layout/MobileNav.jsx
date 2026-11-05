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

function Tab({ to, label, short, icon: Icon, hasAlert, compact }) {
  const accessibleName = hasAlert ? `${label}, notifications non lues` : label

  return (
    <NavLink to={to} aria-label={accessibleName}
      className={({ isActive }) => cn(
        'relative flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-[1.35rem] px-0.5 outline-none transition-[background-color,color,box-shadow,transform] duration-200 focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:scale-95',
        compact && 'rounded-[1.15rem]',
        isActive
          ? 'bg-brand-400/20 text-brand-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] ring-1 ring-brand-500/25 ring-inset dark:bg-brand-300/20 dark:text-brand-50 dark:ring-brand-200/20'
          : 'text-subtle hover:bg-surface-2/70 hover:text-fg',
      )}>
      {({ isActive }) => (
        <>
          <span className="relative grid shrink-0 place-items-center">
            <Icon aria-hidden className={cn(compact ? 'size-5' : 'size-[22px] min-[360px]:size-6')} />
            {hasAlert && <NotificationDot />}
          </span>
          {isActive && compact && (
            <span aria-hidden className="max-w-full truncate text-[9px] leading-none font-semibold">
              {short ?? label}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

// Même barre pour le téléphone et la tablette verticale : capsule opaque en bas,
// bouton "+" central. Le Coach reste accessible via son bouton flottant.
// En paysage iPhone, la capsule devient plus étroite et plus basse.
export default function MobileNav({ compact = false }) {
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
      <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-40"
        style={{
          paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 1rem)',
          paddingRight: 'calc(env(safe-area-inset-right, 0px) + 1rem)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}>
        <div data-nav-zone
          className={cn(
            'nav-glass relative mx-auto mb-2 flex h-14 w-full items-center rounded-[1.65rem]',
            compact
              ? 'max-w-[24rem] gap-0.5 px-1'
              : 'max-w-md min-[360px]:gap-0.5 min-[360px]:px-1',
          )}>
          {findNav(MOBILE_LEFT).map((item) => (
            <Tab key={item.to} {...item} hasAlert={badges.has(item.to)} compact={compact} />
          ))}
          <button type="button" data-nav-zone onClick={() => setOpen(true)} aria-label="Créer ou explorer"
            className={cn(
              '-translate-y-3 grid size-11 shrink-0 place-items-center rounded-[1.15rem] btn-brand shadow-lg shadow-brand-500/30 transition active:scale-95',
              !compact && 'min-[360px]:size-12',
            )}>
            <Plus className="size-6" aria-hidden />
          </button>
          {findNav(MOBILE_RIGHT).map((item) => (
            <Tab key={item.to} {...item} hasAlert={badges.has(item.to)} compact={compact} />
          ))}
        </div>
      </nav>
      <QuickActionsModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
