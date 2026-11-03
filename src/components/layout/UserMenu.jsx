import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { LogOut, Settings, UserRound } from 'lucide-react'
import { useAnchoredPanel } from '../../lib/useAnchoredPanel.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useData } from '../../contexts/DataContext.jsx'
import { useToast } from '../../contexts/ToastContext.jsx'
import { toUserMessage } from '../../lib/errors.js'
import { cn } from '../../lib/cn.js'

export default function UserMenu({ buttonClassName }) {
  const { user, signOut } = useAuth()
  const { profile } = useData()
  const toast = useToast()
  const navigate = useNavigate()
  const { triggerRef, panelRef, open, setOpen, pos, close } = useAnchoredPanel({ width: 264 })
  const name = profile?.display_name || user.email
  const initials = name.slice(0, 2).toUpperCase()

  useEffect(() => {
    if (!open || !pos || panelRef.current?.contains(document.activeElement)) return
    panelRef.current?.querySelector('[role="menuitem"]')?.focus({ preventScroll: true })
  }, [open, pos, panelRef])

  const go = (to) => { close(); navigate(to) }
  const logout = async () => {
    close()
    try { await signOut() } catch (error) { toast.error(toUserMessage(error)) }
  }

  const onKeyDown = (event) => {
    const items = [...(panelRef.current?.querySelectorAll('[role="menuitem"]') ?? [])]
    if (items.length === 0) return
    const index = items.indexOf(document.activeElement)
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      items[(index + step + items.length) % items.length].focus()
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      items[event.key === 'Home' ? 0 : items.length - 1].focus()
    }
  }

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => (open ? close() : setOpen(true))}
        aria-label="Menu du compte" aria-expanded={open} aria-haspopup="menu"
        className={cn('relative grid size-11 shrink-0 place-items-center rounded-2xl border border-line bg-surface-2/70 text-muted transition hover:text-fg active:scale-95', buttonClassName)}>
        <span className="grid size-8 place-items-center rounded-xl bg-linear-to-br from-brand-300 to-brand-500 text-[11px] font-bold text-brand-950">{initials}</span>
      </button>

      {open && createPortal(
        <div ref={panelRef} role="menu" aria-label="Compte" tabIndex={-1} onKeyDown={onKeyDown}
          className={cn('fixed z-50 rounded-3xl border border-line bg-surface p-2 shadow-pop animate-scale-in outline-none', pos?.up ? 'origin-bottom-right' : 'origin-top-right')}
          style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, width: pos?.width ?? 264, visibility: pos ? 'visible' : 'hidden' }}>
          <div className="mb-1 flex items-center gap-3 rounded-2xl bg-surface-2/60 p-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-linear-to-br from-brand-300 to-brand-500 font-display text-sm font-bold text-brand-950">{initials}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-fg">{name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
          </div>
          <button type="button" role="menuitem" onClick={() => go('/profile')}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-fg transition hover:bg-surface-2 focus:bg-surface-2 focus:outline-none">
            <UserRound className="size-4 text-muted" aria-hidden /> Mon profil
          </button>
          <button type="button" role="menuitem" onClick={() => go('/settings')}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-fg transition hover:bg-surface-2 focus:bg-surface-2 focus:outline-none">
            <Settings className="size-4 text-muted" aria-hidden /> Réglages
          </button>
          <div className="my-1 border-t border-line" />
          <button type="button" role="menuitem" onClick={logout}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-500/10 focus:bg-rose-500/10 focus:outline-none dark:text-rose-400">
            <LogOut className="size-4" aria-hidden /> Se déconnecter
          </button>
        </div>,
        document.body,
      )}
    </>
  )
}
