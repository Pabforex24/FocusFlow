'use client'

import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/store'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import * as db from '@/lib/db'

/**
 * useSupabaseSync — Sync incrémentale (delta sync)
 * ──────────────────────────────────────────────────
 * - Premier login → upload des données offline PUIS full sync depuis Supabase
 * - Reconnexions suivantes → delta sync (uniquement ce qui a changé)
 * - SIGNED_OUT → reset complet du lastSyncedAt pour forcer un full sync au prochain login
 */
export function useSupabaseSync() {
  const setSupabaseUser     = useStore((s) => s.setSupabaseUser)
  const hydrateFromSupabase = useStore((s) => s.hydrateFromSupabase)
  const mergeFromSupabase   = useStore((s) => s.mergeFromSupabase)
  const setLastSyncedAt     = useStore((s) => s.setLastSyncedAt)

  // Lire lastSyncedAt via getState() dans les fonctions async
  // pour éviter la valeur capturée au moment du montage
  const getLastSyncedAt = () => useStore.getState().lastSyncedAt

  const [loading, setLoading]   = useState(false)
  const syncingRef = useRef(false) // empêche les syncs concurrentes

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    // ── Vérifier la session existante au boot ──────────────────────────────
    const bootSync = async () => {
      const { data: { session } } = await supabase!.auth.getSession()
      if (session?.user) {
        setLoading(true)
        try {
          await syncUserData(session.user.id, false)
        } finally {
          setLoading(false)
        }
      }
    }
    bootSync()

    // ── Écouter les changements d'état auth ────────────────────────────────
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setLoading(true)
          try {
            // SIGNED_IN = vrai login (pas juste un refresh de token)
            // → forcer un full sync pour récupérer les données des autres appareils
            await syncUserData(session.user.id, true)
          } finally {
            setLoading(false)
          }
        }

        if (event === 'SIGNED_OUT') {
          setSupabaseUser(null)
          // Reset lastSyncedAt → le prochain login fera un full sync
          setLastSyncedAt(null)
          // Purger le store persisté
          if (typeof window !== 'undefined') {
            localStorage.removeItem('focusflow-store-v10')
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  /**
   * syncUserData
   * @param userId      - ID Supabase de l'utilisateur
   * @param forceFullSync - true lors d'un vrai login (SIGNED_IN)
   */
  async function syncUserData(userId: string, forceFullSync: boolean) {
    if (syncingRef.current) return
    syncingRef.current = true

    try {
      setSupabaseUser(userId)
      const syncStart    = new Date().toISOString()
      const lastSyncedAt = getLastSyncedAt()
      const isFirstSync  = !lastSyncedAt || forceFullSync

      if (isFirstSync) {
        // ── 1. Upload des données offline vers Supabase ──────────────────────
        // Si l'utilisateur avait des données locales (mode offline),
        // on les envoie d'abord avant d'écraser avec le serveur.
        const local = useStore.getState()
        if (local.domains.length > 0 || local.tasks.length > 0) {
          await uploadLocalData(userId, local)
        }

        // ── 2. Full sync depuis Supabase ─────────────────────────────────────
        const [profile, domains, goals, tasks, customChallenges, activeChallenges] =
          await Promise.all([
            db.loadProfile(userId),
            db.loadDomains(userId),
            db.loadGoals(userId),
            db.loadTasks(userId),
            db.loadCustomChallenges(userId),
            db.loadActiveChallenges(userId),
          ])
        hydrateFromSupabase({ profile, domains, goals, tasks, customChallenges, activeChallenges })
        setLastSyncedAt(syncStart)
        return
      }

      // ── Delta sync — uniquement ce qui a changé depuis lastSyncedAt ────────
      const [profile, domains, goals, tasks, customChallenges, activeChallenges] =
        await Promise.all([
          db.loadProfile(userId),
          db.loadDomainsSince(userId, lastSyncedAt),
          db.loadGoalsSince(userId, lastSyncedAt),
          db.loadTasksSince(userId, lastSyncedAt),
          db.loadCustomChallengesSince(userId, lastSyncedAt),
          db.loadActiveChallengesSince(userId, lastSyncedAt),
        ])

      const hasDelta =
        domains.length > 0 || goals.length > 0 || tasks.length > 0 ||
        customChallenges.length > 0 || activeChallenges.length > 0

      mergeFromSupabase({
        profile,
        domains:          hasDelta ? domains          : [],
        goals:            hasDelta ? goals            : [],
        tasks:            hasDelta ? tasks            : [],
        customChallenges: hasDelta ? customChallenges : [],
        activeChallenges: hasDelta ? activeChallenges : [],
      })
      setLastSyncedAt(syncStart)

    } finally {
      syncingRef.current = false
    }
  }

  /**
   * uploadLocalData — envoie les données offline vers Supabase
   * Utilise upsert pour éviter les doublons si déjà partiellement syncé.
   */
  async function uploadLocalData(userId: string, local: ReturnType<typeof useStore.getState>) {
    try {
      await Promise.allSettled([
        ...local.domains.map((d) => db.insertDomain(userId, d).catch(() => {})),
        ...local.goals.map((g) => db.insertGoal(userId, g).catch(() => {})),
        ...local.tasks.map((t) => db.insertTask(userId, t).catch(() => {})),
        ...local.customChallenges.map((c) => db.upsertCustomChallenge(userId, c).catch(() => {})),
        ...local.activeChallenges.map((ac) => db.insertActiveChallenge(userId, ac).catch(() => {})),
      ])
    } catch {
      // L'upload offline est best-effort — on continue même en cas d'erreur
    }
  }

  return {
    loading,
    isOnline: isSupabaseConfigured,
  }
}
