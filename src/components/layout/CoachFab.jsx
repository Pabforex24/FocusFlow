import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useFocus } from '../../contexts/FocusContext.jsx'
import { MOBILE_LEFT, MOBILE_RIGHT } from './navigation.js'

const MOBILE_PAGES = new Set([...MOBILE_LEFT, ...MOBILE_RIGHT])
const SIZE = 56
const MARGIN = 8
const NAV_ZONE_SELECTOR = '[data-nav-zone]'

const keyFor = (layout) => `focusflow-coach-pos-${layout}`

function clampViewport(pos) {
  const maxX = Math.max(MARGIN, window.innerWidth - SIZE - MARGIN)
  const maxY = Math.max(MARGIN, window.innerHeight - SIZE - MARGIN)
  return {
    x: Math.min(Math.max(pos.x, MARGIN), maxX),
    y: Math.min(Math.max(pos.y, MARGIN), maxY),
  }
}

// Le bouton reste collé à un bord : seul son déplacement vertical est libre.
function snapToSide(pos) {
  const clamped = clampViewport(pos)
  const maxX = Math.max(MARGIN, window.innerWidth - SIZE - MARGIN)
  return { x: clamped.x + SIZE / 2 < window.innerWidth / 2 ? MARGIN : maxX, y: clamped.y }
}

function getNavZones() {
  return [...document.querySelectorAll(NAV_ZONE_SELECTOR)]
    .map((element) => element.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0)
}

function overlapsNav(pos, zones) {
  return zones.some((zone) => (
    pos.x < zone.right + MARGIN
    && pos.x + SIZE > zone.left - MARGIN
    && pos.y < zone.bottom + MARGIN
    && pos.y + SIZE > zone.top - MARGIN
  ))
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

// Garde le bouton dans l'écran et hors de la barre de navigation, du rail et de la capsule.
function resolvePos(pos) {
  const target = snapToSide(pos)
  const zones = getNavZones()
  if (zones.length === 0 || !overlapsNav(target, zones)) return target

  const candidates = zones.flatMap((zone) => [
    { x: target.x, y: zone.top - SIZE - MARGIN },
    { x: target.x, y: zone.bottom + MARGIN },
  ])
  candidates.push(
    { x: MARGIN, y: MARGIN },
    { x: window.innerWidth - SIZE - MARGIN, y: MARGIN },
    { x: MARGIN, y: window.innerHeight - SIZE - MARGIN },
    { x: window.innerWidth - SIZE - MARGIN, y: window.innerHeight - SIZE - MARGIN },
  )

  const free = candidates
    .map(snapToSide)
    .filter((candidate) => !overlapsNav(candidate, zones))
  if (free.length === 0) return target
  return free.reduce((best, candidate) => (distance(candidate, target) < distance(best, target) ? candidate : best))
}

function readPos(layout) {
  try {
    const saved = JSON.parse(localStorage.getItem(keyFor(layout)) ?? 'null')
    return saved && Number.isFinite(saved.x) && Number.isFinite(saved.y) ? snapToSide(saved) : null
  } catch {
    return null
  }
}

function savePos(layout, pos) {
  try { localStorage.setItem(keyFor(layout), JSON.stringify(pos)) } catch { /* stockage indisponible */ }
}

// Le Coach quitte la barre du bas sur mobile/tablette et devient un bouton flottant,
// déplaçable, réduit à son icône. Il s'efface pendant une session Focus pour ne pas
// recouvrir la barre de session.
export default function CoachFab({ layout }) {
  const { pathname } = useLocation()
  const { active } = useFocus()
  const navigate = useNavigate()
  const buttonRef = useRef(null)
  const dragRef = useRef(null)
  const lastDragRef = useRef(0)
  const [pos, setPos] = useState(() => readPos(layout))

  useEffect(() => {
    if (layout === 'desktop') { setPos(null); return }
    const saved = readPos(layout)
    setPos(saved ? resolvePos(saved) : null)
  }, [layout])

  useEffect(() => {
    if (!pos) return undefined
    const keepFree = () => setPos((current) => (current ? resolvePos(current) : current))
    window.addEventListener('resize', keepFree)
    window.visualViewport?.addEventListener('resize', keepFree)
    return () => {
      window.removeEventListener('resize', keepFree)
      window.visualViewport?.removeEventListener('resize', keepFree)
    }
  }, [pos])

  if (layout === 'desktop' || active || !MOBILE_PAGES.has(pathname)) return null

  const compact = layout === 'compact'
  const style = pos
    ? { left: pos.x, top: pos.y }
    : compact
      ? { right: 'calc(env(safe-area-inset-right, 0px) + 0.5rem)', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }
      : { right: 'calc(env(safe-area-inset-right, 0px) + 0.5rem)', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 6.25rem)' }

  const onPointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const rect = buttonRef.current.getBoundingClientRect()
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: rect.left,
      originY: rect.top,
      moved: false,
      next: null,
    }
    try { event.currentTarget.setPointerCapture?.(event.pointerId) } catch { /* pointeur déjà relâché */ }
  }

  const onPointerMove = (event) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY
    if (!drag.moved && Math.hypot(dx, dy) < 5) return
    drag.moved = true
    event.preventDefault()
    drag.next = resolvePos({ x: drag.originX + dx, y: drag.originY + dy })
    setPos(drag.next)
  }

  const endDrag = (event) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    if (drag.moved) {
      lastDragRef.current = Date.now()
      if (drag.next) savePos(layout, drag.next)
    }
    dragRef.current = null
    try { event.currentTarget.releasePointerCapture?.(event.pointerId) } catch { /* capture déjà perdue */ }
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label="Ouvrir le Coach"
      data-coach-fab
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClick={(event) => {
        if (Date.now() - lastDragRef.current < 400) { event.preventDefault(); return }
        navigate('/coach')
      }}
      className="fixed z-40 grid size-14 touch-none place-items-center rounded-full btn-brand shadow-lg shadow-brand-500/25 transition active:scale-95 cursor-grab active:cursor-grabbing"
      style={style}
    >
      <Sparkles className="size-6" aria-hidden />
    </button>
  )
}
