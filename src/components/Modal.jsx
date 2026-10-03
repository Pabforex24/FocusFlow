import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { IconButton } from './ui/Button.jsx'
import { cn } from '../lib/cn.js'

// Bloque le défilement de la page derrière la modale (technique fiable sur iOS Safari).
function useScrollLock() {
  useEffect(() => {
    const y = window.scrollY
    const { style } = document.body
    const previous = { position: style.position, top: style.top, width: style.width }
    style.position = 'fixed'
    style.top = `-${y}px`
    style.width = '100%'
    return () => {
      style.position = previous.position
      style.top = previous.top
      style.width = previous.width
      window.scrollTo(0, y)
    }
  }, [])
}

const sizes = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' }
const iconTones = {
  brand: 'bg-brand-500/10 text-brand-600 dark:text-brand-300',
  danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
}

// Mobile : feuille qui monte du bas de l'écran. Desktop : fenêtre centrée.
export default function Modal({ title, description, icon: Icon, tone = 'brand', size = 'md', onClose, children }) {
  useScrollLock()
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-sm animate-fade-in sm:items-center sm:p-6"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title}
        className={cn(
          'flex max-h-[92dvh] w-full flex-col rounded-t-3xl border border-line bg-surface shadow-pop animate-sheet-up',
          'sm:max-h-[85dvh] sm:rounded-3xl sm:animate-scale-in', sizes[size],
        )}>
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-line sm:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 sm:px-6 sm:pt-6">
          <div className="flex min-w-0 items-center gap-3">
            {Icon && <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', iconTones[tone])}><Icon className="size-5" aria-hidden /></span>}
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight text-fg">{title}</h2>
              {description && <p className="text-sm text-muted">{description}</p>}
            </div>
          </div>
          <IconButton icon={X} label="Fermer" size="sm" onClick={onClose} className="-mr-1" />
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 pt-1 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-6">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
