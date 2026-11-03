import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Plus } from 'lucide-react'
import QuickActionsModal from './QuickActionsModal.jsx'
import { MOBILE_LEFT, MOBILE_RIGHT, findNav } from './navigation.js'
import { cn } from '../../lib/cn.js'

function Tab({ to, label, short, icon: Icon }) {
  return (
    <NavLink to={to} aria-label={label}
      className={({ isActive }) => cn(
        'flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl text-[9px] font-medium transition-colors min-[360px]:text-[10px]',
        isActive ? 'bg-brand-500/12 text-brand-700 dark:text-brand-300' : 'text-subtle hover:bg-surface-2 hover:text-fg',
      )}>
      <Icon className="size-5" aria-hidden />
      <span className="w-full truncate px-1 text-center">{short ?? label}</span>
    </NavLink>
  )
}

export default function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-40 pb-safe md:hidden">
        <div className="mx-auto mb-2 grid h-16 w-[calc(100%-0.5rem)] max-w-md grid-cols-[repeat(6,minmax(2.75rem,1fr))_2.75rem] items-center rounded-3xl border border-line bg-surface/95 p-0.5 shadow-card backdrop-blur-xl">
          {findNav(MOBILE_LEFT).map((item) => <Tab key={item.to} {...item} />)}
          <div className="flex justify-center">
            <button type="button" onClick={() => setOpen(true)} aria-label="Créer ou explorer"
              className="-mt-5 grid size-14 place-items-center rounded-2xl btn-brand shadow-lg shadow-brand-500/30 transition active:scale-95">
              <Plus className="size-7" aria-hidden />
            </button>
          </div>
          {findNav(MOBILE_RIGHT).map((item) => <Tab key={item.to} {...item} />)}
        </div>
      </nav>
      <QuickActionsModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
