'use client'

/**
 * useSupabaseSync — Synchronisation Supabase avec sync incrémentale
 *
 * Architecture :
 *  • bootSync    : au montage, charge toutes les données (fullSync)
 *  • fullSync    : charge tout depuis Supabase (boot, reconnexion)
 *  • deltaSync   : charge uniquement les données modifiées depuis lastSyncedAt
 *                  (poll 60s, retour foreground) → beaucoup moins de données
 *  • isInserting : garde contre la race condition addTask/fullSync
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useStore } from '@/store'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import * from '@/lib/db'

const POLL_INTERVAL_MS = 60_000
const BOOT_DELAY_MS    = 800

export function useSupabaseSync() {
  const setSupabaseUser        = useStore((s) => s.setSupabaseUser)
  const setUserEmail           = useStore((s) => s.setUserEmail as (e: string | null) => void)
  const hydrateFromSupabase    = useStore((s) => s.hydrateFromSupabase)
  const mergeFromSupabase      = useStore((s) => s.mergeFromSupabase)
  const setLastSyncedAt        = useStore((s) => s.setLastSyncedAt)
  const setRecurringTemplates  = useStore((s) => s.setRecurringTemplates as (t) => void)

  const [loading, setLoading] = useState(false)
  const syncingRef  = useRef(false)
  const userIdRef   = useRef(null)
  const bootDoneRef = useRef(false)

  const isInserting = () => useStore.getState().isInserting
  const getLastSyncedAt = () => useStore.getState().lastSyncedAt

  // ── Full sync (boot, reconnexion) ─────────────────────────────────────────
  const fullSync = useCallback(async (userId, source = 'unknown') => {
    if (syncingRef.current) return
    if (isInserting()) {
      console.log('[sync] fullSync bloqué — insert en cours')
      return
    }
    syncingRef.current = true
    console.log('[sync] fullSync START —', source)
    try {
      const [profile, domains, goals, tasks, customChallenges, activeChallenges, recurringTemplates] =
        await Promise.all([
          db.loadProfile(userId),
          db.loadDomains(userId),
          db.loadGoals(userId),
          db.loadTasks(userId),
          db.loadCustomChallenges(userId),
          db.loadActiveChallenges(userId),
          db.loadRecurringTemplates(userId),
        ])

      if (isInserting()) {
        console.log('[sync] fullSync annulé post-fetch — insert démarré')
        return
      }

      hydrateFromSupabase({ profile, domains, goals, tasks, customChallenges, activeChallenges })
      setRecurringTemplates(recurringTemplates)
      setLastSyncedAt(new Date().toISOString())
      console.log('[sync] fullSync DONE — tasks:', tasks.length, 'goals:', goals.length)
    } catch (err) {
      console.error('[sync] fullSync ERREUR:', err)
    } finally {
      syncingRef.current = false
    }
  }, [hydrateFromSupabase, setLastSyncedAt, setRecurringTemplates])

  // ── Delta sync (poll, visibility) ─────────────────────────────────────────
  // Ne charge que les enregistrements modifiés depuis lastSyncedAt
  const deltaSync = useCallback(async (userId, source = 'delta') => {
    if (syncingRef.current) return
    if (isInserting()) {
      console.log('[sync] deltaSync bloqué — insert en cours')
      return
    }

    const since = getLastSyncedAt()
    if (!since) {
      // Pas encore de sync complète — faire un fullSync à la place
      return fullSync(userId, 'delta-fallback')
    }

    syncingRef.current = true
    console.log('[sync] deltaSync START —', source, '— depuis:', since)
    try {
      const [domains, goals, tasks, customChallenges, activeChallenges] =
        await Promise.all([
          db.loadDomainsSince(userId, since),
          db.loadGoalsSince(userId, since),
          db.loadTasksSince(userId, since),
          db.loadCustomChallengesSince(userId, since),
          db.loadActiveChallengesSince(userId, since),
        ])

      if (isInserting()) {
        console.log('[sync] deltaSync annulé post-fetch — insert démarré')
        return
      }

      const hasChanges = domains.length + goals.length + tasks.length +
        customChallenges.length + activeChallenges.length > 0

      if (hasChanges) {
        console.log('[sync] deltaSync — changements détectés:',
          { domains: domains.length, goals: goals.length, tasks: tasks.length })
        mergeFromSupabase({
          profile,
          domains,
          goals,
          tasks,
          customChallenges,
          activeChallenges,
        })
      } else {
        console.log('[sync] deltaSync — aucun changement')
      }

      setLastSyncedAt(new Date().toISOString())
    } catch (err) {
      console.error('[sync] deltaSync ERREUR:', err)
    } finally {
      syncingRef.current = false
    }
  }, [fullSync, mergeFromSupabase, setLastSyncedAt])

  const manualSync = useCallback(async () => {
    const userId = userIdRef.current
    if (!userId) return
    setLoading(true)
    try { await fullSync(userId, 'manual') }
    finally { setLoading(false) }
  }, [fullSync])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    const bootSync = async () => {
      try {
        const { data: { session } } = await supabase?.auth.getSession()
        if (session?.user) {
          setUserEmail(session.user.email ?? null)
          setSupabaseUser(session.user.id)
          userIdRef.current   = session.user.id
          bootDoneRef.current = true
          setLoading(true)
          await new Promise((r) => setTimeout(r, BOOT_DELAY_MS))
          try { await fullSync(session.user.id, 'boot') }
          finally { setLoading(false) }
        }
      } catch (err) {
        console.error('[sync] bootSync ERREUR:', err)
      }
    }
    bootSync()

    const { data: { subscription } } = supabase?.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          if (bootDoneRef.current) { bootDoneRef.current = false; return }
          setUserEmail(session.user.email ?? null)
          setSupabaseUser(session.user.id)
          userIdRef.current = session.user.id
          setLoading(true)
          await new Promise((r) => setTimeout(r, BOOT_DELAY_MS))
          try { await fullSync(session.user.id, 'sign-in') }
          finally { setLoading(false) }
        }
        if (event === 'SIGNED_OUT') {
          setSupabaseUser(null)
          setUserEmail(null)
          userIdRef.current   = null
          bootDoneRef.current = false
          if (typeof window !== 'undefined') localStorage.removeItem('focusflow-store-v11')
        }
      }
    )

    // Poll toutes les 60s — delta uniquement (léger)
    const poll = setInterval(() => {
      if (userIdRef.current) deltaSync(userIdRef.current, 'poll')
    }, POLL_INTERVAL_MS)

    // Retour foreground — delta uniquement
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && userIdRef.current)
        deltaSync(userIdRef.current, 'visibility')
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      subscription.unsubscribe()
      clearInterval(poll)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [fullSync, deltaSync, setLastSyncedAt, setSupabaseUser, setUserEmail])

  return { loading, isOnline: isSupabaseConfigured, manualSync }
}
