import { useSyncExternalStore } from 'react'

const DESKTOP = '(pointer: fine) and (min-width: 768px) and (min-height: 560px)'
const COMPACT = '(pointer: coarse) and (orientation: landscape) and (max-height: 520px)'

function getSnapshot() {
  if (typeof window === 'undefined') return 'desktop'
  if (window.matchMedia(COMPACT).matches) return 'compact'
  if (window.matchMedia(DESKTOP).matches) return 'desktop'
  return 'standard'
}

function subscribe(callback) {
  if (typeof window === 'undefined') return () => {}
  const queries = [window.matchMedia(DESKTOP), window.matchMedia(COMPACT)]
  queries.forEach((query) => query.addEventListener('change', callback))
  return () => queries.forEach((query) => query.removeEventListener('change', callback))
}

export function useNavLayout() {
  return useSyncExternalStore(subscribe, getSnapshot, () => 'desktop')
}
