'use client'

import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/store'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import * as db from '@/lib/db'
import type { Domain, Goal, Task, Challenge, ActiveChallenge } from '@/types'

const POLL_INTERVAL_MS = 30_000 // sync delta toutes les 30 secondes

/**
 * useSupabaseSync — Sync complète desktop ↔ mobile
 * ──────────────────────────────────────────────────
 * - Boot : vérifie session existante → delta sync (ou full si lastSyncedAt vide)
 * - SIGNED_IN (vrai login) : upload données offline + full sync
 * - SIGNED_OUT : reset lastSyncedAt + purge localStorage
 * - Polling : delta sync toutes les 30s pour récupérer les changements cross-device
 * - syncingRef : bloque les syncs concurrentes SANS bloquer les re-syncs PWA
 */
export function useSupabaseSync() {
  const setSupabaseUser     = useStore((s) => s.setSupabaseUser)
  const setUserEmail        = useStore((s: any) => s.setUserEmail as (email: string | null) => void)
  const hydrateFromSupabase = useStore((s) => s.hydrateFromSupabase)
  const mergeFromSupabase   = useStore((s) => s.mergeFromSupabase)
  const setLastSyncedAt     = useStore((s) => s.setLastSyncedAt)

  const getLastSyncedAt = () => useStore.getState().lastSyncedAt

  const [loading, setLoading] = useState(false)
  const syncingRef  = useRef(false)
  const bootDoneRef = useRef(false)
  const userIdRef   = useRef<string | null>(null) // pour le polling

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    // ── Boot : vérifier la session existante ───────────────────────────────
    const bootSync = async () => {
      const { data: { session } } = await supabase!.auth.getSession()
      if (session?.user) {
        setUserEmail(session.user.email ?? null)
        setSupabaseUser(session.user.id)
        userIdRef.current = session.user.id
        bootDoneRef.current = true
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
          if (bootDoneRef.current) {
            bootDoneRef.current = false
            return
          }
          setUserEmail(session.user.email ?? null)
          userIdRef.current = session.user.id
          setLoading(true)
          try {
            await syncUserData(session.user.id, true)
          } finally {
            setLoading(false)
          }
        }

        if (event === 'SIGNED_OUT') {
          setSupabaseUser(null)
          setUserEmail(null)
          userIdRef.current = null
          bootDoneRef.current = false
          setLastSyncedAt('')
          if (typeof window !== 'undefined') {
            localStorage.removeItem('focusflow-store-v10')
          }
        }
      }
    )

    // ── Polling delta sync toutes les 30s ──────────────────────────────────
    const pollInterval = setInterval(async () => {
      const userId = userIdRef.current
      if (!userId) return
      // Sync silencieuse — pas de setLoading pour ne pas flasher l'UI
      await syncUserData(userId, false)
    }, POLL_INTERVAL_MS)

    // ── Sync au retour en foreground (reprise depuis arrière-plan PWA) ─────
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const userId = userIdRef.current
        if (userId) await syncUserData(userId, false)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      subscription.unsubscribe()
      clearInterval(pollInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  /**
   * syncUserData
   * @param userId        - ID Supabase de l'utilisateur
   * @param forceFullSync - true sur SIGNED_IN (vrai login), false au boot/polling
   */
  async function syncUserData(userId: string, forceFullSync: boolean) {
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
        // ── Upload données offline ───────────────────────────────────────────
        const local = useStore.getState()
        const hasLocalData = local.domains.length > 0 || local.tasks.length > 0 ||
          local.goals.length > 0 || local.customChallenges?.length > 0
        if (hasLocalData) {
          await uploadLocalData(userId, local)
        }

        // ── Full sync depuis Supabase ────────────────────────────────────────
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

  async function uploadLocalData(userId: string, local: ReturnType<typeof useStore.getState>) {
    await Promise.allSettled([
      ...local.domains.map((d: Domain) => db.insertDomain(userId, d).catch(() => {})),
      ...local.goals.map((g: Goal) => db.insertGoal(userId, g).catch(() => {})),
      ...(local.customChallenges || []).map((c: Challenge) => db.upsertCustomChallenge(userId, c).catch(() => {})),
      ...(local.activeChallenges || []).map((ac: ActiveChallenge) => db.insertActiveChallenge(userId, ac).catch(() => {})),
      ...local.tasks.map((t: Task) => db.insertTask(userId, t).catch(() => {})),
    ])
  }

  return {
    loading,
    isOnline: isSupabaseConfigured,
  }
}
