import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { EllipsisVertical } from 'lucide-react'
import { IconButton } from './Button.jsx'
import { cn } from '../../lib/cn.js'

const MENU_WIDTH = 208 // 13rem
const GAP = 6
const MARGIN = 8

// Menu "trois points". items = [{ label, icon, onClick, danger }]
//
// Le menu est affiché dans <body> (portail) en position "fixed", calculée à partir du bouton.
// Pourquoi : les cartes de la liste (verre dépoli : backdrop-filter, animations, overflow) créent chacune leur
// propre "stacking context". Un menu en position absolue DANS la carte reste enfermé dans ce contexte, et les
// cartes suivantes passent par-dessus, quel que soit son z-index. Hors de la carte, plus aucun parent ne peut le
// masquer ni le couper.
export function Menu({ items, label = 'Plus d\'actions' }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  const close = useCallback(() => { setOpen(false); setPos(null) }, [])

  // Place le menu sous le bouton (ou au-dessus s'il manque de la place), sans jamais sortir de l'écran.
  const place = useCallback(() => {
    const trigger = triggerRef.current?.getBoundingClientRect()
    if (!trigger) return
    const vw = window.innerWidth
    const vh = window.innerHeight
    if (trigger.bottom < 0 || trigger.top > vh) { close(); return } // le bouton a quitté l'écran
    const width = Math.min(MENU_WIDTH, vw - MARGIN * 2)
    const height = menuRef.current?.offsetHeight ?? 0
    const left = Math.min(Math.max(trigger.right - width, MARGIN), vw - width - MARGIN)
    const spaceBelow = vh - trigger.bottom - GAP - MARGIN
    const spaceAbove = trigger.top - GAP - MARGIN
    const up = height > spaceBelow && spaceAbove > spaceBelow
    const rawTop = up ? trigger.top - GAP - height : trigger.bottom + GAP
    const top = Math.max(MARGIN, Math.min(rawTop, vh - height - MARGIN))
    setPos({ left, top, width, up })
  }, [close])

  // Mesure le menu avant l'affichage pour éviter tout saut visuel.
  useLayoutEffect(() => { if (open) place() }, [open, place])

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (triggerRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return
      close()
    }
    const onKey = (e) => { if (e.key === 'Escape') { close(); triggerRef.current?.focus() } }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true) // true : aussi les défilements internes
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, place, close])

  return (
    <>
      <IconButton ref={triggerRef} icon={EllipsisVertical} label={label} size="sm" onClick={() => (open ? close() : setOpen(true))} aria-expanded={open} aria-haspopup="menu" />
      {open && createPortal(
        <div ref={menuRef} role="menu"
          className={cn('fixed z-50 animate-scale-in rounded-2xl border border-line bg-surface p-1.5 shadow-pop', pos?.up ? 'origin-bottom-right' : 'origin-top-right')}
          style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, width: pos?.width ?? MENU_WIDTH, visibility: pos ? 'visible' : 'hidden' }}>
          {items.map(({ label: text, icon: Icon, onClick, danger }) => (
            <button key={text} type="button" role="menuitem" onClick={() => { close(); onClick() }}
              className={cn('flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors',
                danger ? 'text-rose-600 hover:bg-rose-500/10 dark:text-rose-400' : 'text-fg hover:bg-surface-2')}>
              {Icon && <Icon className="size-4 shrink-0" aria-hidden />}{text}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}

export default Menu
