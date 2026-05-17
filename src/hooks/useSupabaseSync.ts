'use client'

import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/store'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import * as db from '@/lib/db'
import type { Domain, Goal, Task, Challenge, ActiveChallenge } from '@/types'

/**
 * useSupabaseSync — Sync complète desktop ↔ mobile
 * ──────────────────────────────────────────────────
 * - Boot : vérifie session existante → delta sync (ou full si lastSyncedAt vide)
 * - SIGNED_IN (vrai login) : upload données offline + full sync
 * - SIGNED_OUT : reset lastSyncedAt + purge localStorage
 * - syncingRef : bloque les syncs concurrentes SANS bloquer les re-syncs PWA
 */
export function useSupabaseSync() {
  const setSupabaseUser     = useStore((s) => s.setSupabaseUser)
  const setUserEmail        = useStore((s: any) => s.setUserEmail as (email: string | null) => void)
  const hydrateFromSupabase = useStore((s) => s.hydrateFromSupabase)
  const mergeFromSupabase   = useStore((s) => s.mergeFromSupabase)
  const setLastSyncedAt     = useStore((s) => s.setLastSyncedAt)

  // Lire lastSyncedAt via getState() pour toujours avoir la valeur actuelle dans les fonctions async
  const getLastSyncedAt = () => useStore.getState().lastSyncedAt

  const [loading, setLoading] = useState(false)
  const syncingRef   = useRef(false) // bloque les syncs concurrentes
  const bootDoneRef  = useRef(false) // évite que SIGNED_IN redouble le bootSync

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    // ── Vérifier la session existante au boot ──────────────────────────────
    const bootSync = async () => {
      const { data: { session } } = await supabase!.auth.getSession()
      if (session?.user) {
        bootDoneRef.current = true  // signale à SIGNED_IN qu'il ne doit pas re-syncer
        setUserEmail(session.user.email ?? null)
        setLoading(true)
        try {
          // Boot = reconnexion existante → delta sync (pas d'upload offline)
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
          // Si bootSync a déjà géré cette session, on skip pour éviter le double sync
          if (bootDoneRef.current) {
            bootDoneRef.current = false
            return
          }
          setUserEmail(session.user.email ?? null)
          setLoading(true)
          try {
            // Vrai login utilisateur → upload offline + full sync
            await syncUserData(session.user.id, true)
          } finally {
            setLoading(false)
          }
        }

        if (event === 'SIGNED_OUT') {
          setSupabaseUser(null)
          setUserEmail(null)
          bootDoneRef.current = false
          // Reset → prochain login fera un full sync
          setLastSyncedAt('')
          // Purger le store persisté pour éviter session fantôme
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
   * @param userId       - ID Supabase de l'utilisateur
   * @param forceFullSync - true sur SIGNED_IN (vrai login), false au boot
   */
  async function syncUserData(userId: string, forceFullSync: boolean) {
    // Attendre si une sync est en cours (max 3s pour éviter deadlock)
    if (syncingRef.current) {
      await new Promise<void>((resolve) => {
        const t = setInterval(() => { if (!syncingRef.current) { clearInterval(t); resolve() } }, 100)
        setTimeout(() => { clearInterval(t); resolve() }, 3000)
      })
    }
    syncingRef.current = true

    try {
      setSupabaseUser(userId)
      const syncStart    = new Date().toISOString()
      const lastSyncedAt = getLastSyncedAt()
      const isFirstSync  = !lastSyncedAt || forceFullSync

      if (isFirstSync) {
        // ── 1. Upload données offline vers Supabase (best-effort) ───────────
        const local = useStore.getState()
        const hasLocalData = local.domains.length > 0 || local.tasks.length > 0 ||
          local.goals.length > 0 || local.customChallenges?.length > 0
        if (hasLocalData) {
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

      mergeFromSupabase({
        profile,
        domains,
        goals,
        tasks,
        customChallenges,
        activeChallenges,
      })
      setLastSyncedAt(syncStart)

    } finally {
      syncingRef.current = false
    }
  }

  /**
   * uploadLocalData — envoie les données offline vers Supabase avant le full sync.
   * Best-effort : les erreurs (doublons, FK manquantes) sont ignorées silencieusement.
   */
  async function uploadLocalData(userId: string, local: ReturnType<typeof useStore.getState>) {
    await Promise.allSettled([
      ...local.domains.map((d: Domain) => db.insertDomain(userId, d).catch(() => {})),
      ...local.goals.map((g: Goal) => db.insertGoal(userId, g).catch(() => {})),
      ...(local.customChallenges || []).map((c: Challenge) => db.upsertCustomChallenge(userId, c).catch(() => {})),
      ...(local.activeChallenges || []).map((ac: ActiveChallenge) => db.insertActiveChallenge(userId, ac).catch(() => {})),
      // Tasks en dernier (dépendent des domains/goals/activeChallenges)
      ...local.tasks.map((t: Task) => db.insertTask(userId, t).catch(() => {})),
    ])
  }

  return {
    loading,
    isOnline: isSupabaseConfigured,
  }
}
