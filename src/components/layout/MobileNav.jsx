import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { ChevronRight, Plus } from 'lucide-react'
import Modal from '../Modal.jsx'
import { CREATE_ACTIONS, MOBILE_LEFT, MOBILE_RIGHT, NAV_ITEMS, findNav } from './navigation.js'
import { cn } from '../../lib/cn.js'

function Tab({ to, label, icon: Icon }) {
  return (
    <NavLink to={to} aria-label={label}
      className={({ isActive }) => cn('flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors', isActive ? 'text-brand-600 dark:text-brand-300' : 'text-subtle')}>
      {({ isActive }) => (
        <>
          <span className={cn('rounded-full px-4 py-1 transition-colors', isActive && 'bg-brand-500/12')}><Icon className="size-5" aria-hidden /></span>
          {label}
        </>
      )}
    </NavLink>
  )
}

function SheetRow({ icon: Icon, label, hint, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-surface-2 active:scale-[0.99]">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300"><Icon className="size-5" aria-hidden /></span>
      <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-fg">{label}</span>{hint && <span className="block text-xs text-muted">{hint}</span>}</span>
      <ChevronRight className="size-4 text-subtle" aria-hidden />
    </button>
  )
}

export default function MobileNav() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const go = (to) => { setOpen(false); navigate(to) }
  const shown = new Set([...MOBILE_LEFT, ...MOBILE_RIGHT])
  const explore = NAV_ITEMS.filter((i) => !shown.has(i.to))

  return (
    <>
      <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 pb-safe backdrop-blur-lg md:hidden">
        <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center">
          {findNav(MOBILE_LEFT).map((i) => <Tab key={i.to} {...i} />)}
          <div className="flex justify-center">
            <button type="button" onClick={() => setOpen(true)} aria-label="Créer ou explorer"
              className="-mt-6 grid size-14 place-items-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30 transition active:scale-95 dark:bg-brand-500">
              <Plus className="size-7" aria-hidden />
            </button>
          </div>
          {findNav(MOBILE_RIGHT).map((i) => <Tab key={i.to} {...i} />)}
        </div>
      </nav>

      {open && (
        <Modal title="Que voulez-vous faire ?" icon={Plus} onClose={() => setOpen(false)}>
          <p className="mb-1 px-3 text-xs font-semibold tracking-wide text-subtle uppercase">Créer</p>
          {CREATE_ACTIONS.map((a) => <SheetRow key={a.to} {...a} onClick={() => go(a.to)} />)}
          <p className="mt-3 mb-1 px-3 text-xs font-semibold tracking-wide text-subtle uppercase">Explorer</p>
          {explore.map((i) => <SheetRow key={i.to} icon={i.icon} label={i.label} onClick={() => go(i.to)} />)}
        </Modal>
      )}
    </>
  )
}
