import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

const GAP = 8
const MARGIN = 8

// Panneau flottant ancré à un bouton. Le portail et le positionnement évitent
// qu'une carte parente (overflow, backdrop-filter, stacking context) le coupe.
export function useAnchoredPanel({ width = 320, align = 'end' } = {}) {
  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)

  const close = useCallback((restoreFocus = false) => {
    setOpen(false)
    setPos(null)
    if (restoreFocus) triggerRef.current?.focus({ preventScroll: true })
  }, [])

  const place = useCallback(() => {
    const trigger = triggerRef.current?.getBoundingClientRect()
    if (!trigger) return
    const vw = window.innerWidth
    const vh = window.innerHeight
    if (trigger.bottom < 0 || trigger.top > vh) { close(); return }

    const panelWidth = Math.min(width, vw - MARGIN * 2)
    const height = panelRef.current?.offsetHeight ?? 0
    const rawLeft = align === 'end' ? trigger.right - panelWidth : trigger.left
    const left = Math.min(Math.max(rawLeft, MARGIN), vw - panelWidth - MARGIN)
    const spaceBelow = vh - trigger.bottom - GAP - MARGIN
    const spaceAbove = trigger.top - GAP - MARGIN
    const up = height > spaceBelow && spaceAbove > spaceBelow
    const rawTop = up ? trigger.top - GAP - height : trigger.bottom + GAP
    const top = Math.max(MARGIN, Math.min(rawTop, vh - height - MARGIN))
    setPos({ left, top, width: panelWidth, up })
  }, [align, close, width])

  useLayoutEffect(() => {
    if (open) place()
  }, [open, place])

  useEffect(() => {
    if (!open) return undefined
    const onDown = (event) => {
      if (triggerRef.current?.contains(event.target) || panelRef.current?.contains(event.target)) return
      close()
    }
    const onKey = (event) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      close(true)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, place, close])

  return { triggerRef, panelRef, open, setOpen, pos, close, place }
}
