'use client'

import { useEffect } from 'react'
import { useStore } from '@/store'

/**
 * StoreHydrator
 * ─────────────
 * Zustand persist est configuré avec skipHydration: true pour éviter
 * les erreurs d'hydratation SSR.
 *
 * IMPORTANT : rehydrate() est appelé en dernier dans le cycle de vie
 * pour ne PAS écraser les données Supabase si useSupabaseSync a déjà
 * chargé des données fraîches depuis le serveur.
 *
 * La logique est :
 * 1. useSupabaseSync boot → charge depuis Supabase → set() dans le store
 * 2. StoreHydrator → rehydrate() depuis localStorage UNIQUEMENT si le
 *    store est encore vide (pas de données Supabase reçues)
 */
export function StoreHydrator() {
  useEffect(() => {
    // Attendre que useSupabaseSync ait eu le temps de faire son bootSync
    // avant de rehydrater depuis localStorage (évite l'écrasement)
    const timer = setTimeout(() => {
      const state = useStore.getState()
      // Ne rehydrater que si le store est encore vide (pas de sync Supabase)
      if (!state.supabaseUserId) {
        useStore.persist.rehydrate()
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  return null
}
