'use client'

/**
 * useSupabaseSync — Synchronisation Supabase propre pour FocusFlow
 *
 * Architecture :
 *  • bootSync    : au montage, charge toutes les données depuis Supabase
 *  • fullSync    : charge tout (boot, reconnexion, retour foreground, poll)
 *  • isInserting : garde contre la race condition addTask/fullSync
 *
 * Race condition protégée :
 *  Si addTask/addGoal/addDomain est en cours (isInserting=true),
 *  fullSync est bloqué pour ne pas écraser une donnée optimiste non encore
 *  confirmée par Supabase.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useStore } from '@/store'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import * as db from '@/lib/db'

const POLL_INTERVAL_MS = 60_000  // re-sync toutes les 60s
const BOOT_DELAY_MS    = 800     // délai sécurité anti-race-condition au boot

export function useSupabaseSync() {
  const setSupabaseUser     = useStore((s) => s.setSupabaseUser)
  const setUserEmail        = useStore((s: any) => s.setUserEmail as (e: string | null) => void)
  const hydrateFromSupabase = useStore((s) => s.hydrateFromSupabase)
  const setLastSyncedAt        = useStore((s) => s.setLastSyncedAt)
  const setRecurringTemplates  = useStore((s: any) => s.setRecurringTemplates as (t: any[]) => void)

  const [loading, setLoading] = useState(false)
  const syncingRef    = useRef(false)
  const bootDoneRef   = useRef(false)
  const userIdRef     = useRef<string | null>(null)

  // Lire isInserting directement (pas via hook pour éviter re-renders)
  const isInserting = () => useStore.getState().isInserting

  const fullSync = useCallback(async (userId: string, source = 'unknown') => {
    // Bloquer si une sync est déjà en cours
    if (syncingRef.current) {
      console.log('[sync] ignoré — déjà en cours (source:', source, ')')
      return
    }
    // Bloquer si un insert optimiste est en attente de confirmation
    if (isInserting()) {
      console.log('[sync] BLOQUÉ — insert en cours (source:', source, ')')
      return
    }
    syncingRef.current = true
    console.log('[sync] START —', source)
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
      // Vérification post-fetch : annuler si un insert a démarré pendant le fetch
      if (isInserting()) {
        console.log('[sync] ANNULÉ post-fetch — insert démarré pendant le fetch')
        return
      }
      console.log('[sync] hydrate — domains:', domains.length, 'goals:', goals.length, 'tasks:', tasks.length)
      hydrateFromSupabase({ profile, domains, goals, tasks, customChallenges, activeChallenges })
      setRecurringTemplates(recurringTemplates)
      setLastSyncedAt(new Date().toISOString())
      console.log('[sync] DONE')
    } catch (err) {
      console.error('[sync] ERREUR:', err)
    } finally {
      syncingRef.current = false
    }
  }, [hydrateFromSupabase, setLastSyncedAt])

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
        const { data: { session } } = await supabase!.auth.getSession()
        if (session?.user) {
          setUserEmail(session.user.email ?? null)
          setSupabaseUser(session.user.id)
          userIdRef.current  = session.user.id
          bootDoneRef.current = true
          setLoading(true)
          // Délai de sécurité pour éviter la race condition au boot
          await new Promise((r) => setTimeout(r, BOOT_DELAY_MS))
          try { await fullSync(session.user.id, 'boot') }
          finally { setLoading(false) }
        }
      } catch (err) {
        console.error('[sync] bootSync ERREUR:', err)
      }
    }
    bootSync()

    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
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
          setLastSyncedAt('')
          if (typeof window !== 'undefined') localStorage.removeItem('focusflow-store-v11')
        }
      }
    )

    // Polling toutes les 60s
    const poll = setInterval(() => {
      if (userIdRef.current) fullSync(userIdRef.current, 'poll')
    }, POLL_INTERVAL_MS)

    // Re-sync au retour foreground
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && userIdRef.current)
        fullSync(userIdRef.current, 'visibility')
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      subscription.unsubscribe()
      clearInterval(poll)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [fullSync, setLastSyncedAt, setSupabaseUser, setUserEmail])

  return { loading, isOnline: isSupabaseConfigured, manualSync }
}
