'use client'

import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/store'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import * as db from '@/lib/db'

/**
 * useSupabaseSync — Sync incrémentale (delta sync)
 * ──────────────────────────────────────────────────
 * - Premier login → charge tout (full sync)
 * - Reconnexions suivantes → ne charge que ce qui a changé depuis lastSyncedAt
 * - Merge intelligent : les nouvelles données écrasent les entrées existantes
 *   par id, les entrées locales non présentes dans le delta sont conservées
 */
export function useSupabaseSync() {
  const setSupabaseUser     = useStore((s) => s.setSupabaseUser)
  const hydrateFromSupabase = useStore((s) => s.hydrateFromSupabase)
  const mergeFromSupabase   = useStore((s) => s.mergeFromSupabase)
  const lastSyncedAt        = useStore((s) => s.lastSyncedAt)
  const setLastSyncedAt     = useStore((s) => s.setLastSyncedAt)

  const [loading, setLoading] = useState(false)
  const initialized = useRef(false)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    const loadInitial = async () => {
      if (initialized.current) return
      initialized.current = true
      const { data: { session } } = await supabase!.auth.getSession()
      if (session?.user) {
        setLoading(true)
        try {
          await syncUserData(session.user.id)
        } finally {
          setLoading(false)
        }
      }
    }
    loadInitial()

    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setLoading(true)
          try {
            await syncUserData(session.user.id)
          } finally {
            setLoading(false)
          }
        }
        if (event === 'SIGNED_OUT') {
          setSupabaseUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function syncUserData(userId: string) {
    setSupabaseUser(userId)
    const syncStart = new Date().toISOString()

    // ── Full sync si première fois ──────────────────────────────────────────
    if (!lastSyncedAt) {
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

    // ── Delta sync — uniquement ce qui a changé depuis lastSyncedAt ─────────
    const [profile, domains, goals, tasks, customChallenges, activeChallenges] =
      await Promise.all([
        db.loadProfile(userId),                                   // profil toujours rechargé (léger)
        db.loadDomainsSince(userId, lastSyncedAt),
        db.loadGoalsSince(userId, lastSyncedAt),
        db.loadTasksSince(userId, lastSyncedAt),
        db.loadCustomChallengesSince(userId, lastSyncedAt),
        db.loadActiveChallengesSince(userId, lastSyncedAt),
      ])

    // Si le delta est vide on met quand même à jour le profil et le timestamp
    const hasDelta =
      domains.length > 0 || goals.length > 0 || tasks.length > 0 ||
      customChallenges.length > 0 || activeChallenges.length > 0

    if (hasDelta) {
      mergeFromSupabase({ profile, domains, goals, tasks, customChallenges, activeChallenges })
    } else if (profile) {
      // Juste le profil (XP, streak, badges)
      mergeFromSupabase({ profile, domains: [], goals: [], tasks: [], customChallenges: [], activeChallenges: [] })
    }

    setLastSyncedAt(syncStart)
  }

  return {
    loading,
    isOnline: isSupabaseConfigured,
  }
}
