'use client'

import { useEffect } from 'react'
import { useStore } from '@/store'

/**
 * StoreHydrator
 * ─────────────
 * Zustand persist est configuré avec skipHydration: true pour éviter
 * les erreurs d'hydratation SSR (mismatch server/client).
 *
 * Ce composant déclenche la réhydratation manuellement une fois monté
 * côté client, après que Next.js a terminé son hydratation du DOM.
 *
 * À placer dans le RootLayout, à l'intérieur de <body>.
 */
export function StoreHydrator() {
  useEffect(() => {
    useStore.persist.rehydrate()
  }, [])

  return null
}
