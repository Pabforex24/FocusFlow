import { useEffect, useRef, useState } from 'react'
import { EllipsisVertical } from 'lucide-react'
import { IconButton } from './Button.jsx'
import { cn } from '../../lib/cn.js'

// Menu "trois points". items = [{ label, icon, onClick, danger }]
export function Menu({ items, label = 'Plus d\'actions' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <IconButton icon={EllipsisVertical} label={label} size="sm" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="menu" />
      {open && (
        <div role="menu" className="absolute top-full right-0 z-20 mt-1 w-52 origin-top-right animate-scale-in rounded-2xl border border-line bg-surface p-1.5 shadow-pop">
          {items.map(({ label: text, icon: Icon, onClick, danger }) => (
            <button key={text} type="button" role="menuitem" onClick={() => { setOpen(false); onClick() }}
              className={cn('flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors',
                danger ? 'text-rose-600 hover:bg-rose-500/10 dark:text-rose-400' : 'text-fg hover:bg-surface-2')}>
              {Icon && <Icon className="size-4 shrink-0" aria-hidden />}{text}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default Menu
