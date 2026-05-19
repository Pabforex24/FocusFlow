'use client'

import { useEffect } from 'react'
import { useStore } from '@/store'

/**
 * StoreHydrator
 * ─────────────
 * Zustand persist est configuré avec skipHydration: true pour éviter
 * les erreurs d'hydratation SSR (mismatch server/client).
 *
 * Séquence correcte :
 * 1. StoreHydrator → rehydrate() IMMÉDIATEMENT depuis localStorage
 *    (les données locales sont visibles sans attendre Supabase)
 * 2. useSupabaseSync bootSync → charge depuis Supabase → écrase le store
 *    avec les données fraîches du serveur
 *
 * Résultat : pas de flash "page vide" au rechargement, données Supabase
 * chargées dès que disponibles.
 */
export function StoreHydrator() {
  useEffect(() => {
    // Réhydrater immédiatement — c'est useSupabaseSync qui écrasera
    // ensuite avec les données Supabase si l'utilisateur est connecté
    useStore.persist.rehydrate()
  }, [])

  return null
}
