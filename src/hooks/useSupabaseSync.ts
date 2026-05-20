'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useStore } from '@/store'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import * as db from '@/lib/db'

const POLL_INTERVAL_MS = 60_000   // 60s — assez fréquent sans risquer la race condition

export function useSupabaseSync() {
  const setSupabaseUser     = useStore((s) => s.setSupabaseUser)
  const setUserEmail        = useStore((s: any) => s.setUserEmail as (email: string | null) => void)
  const hydrateFromSupabase = useStore((s) => s.hydrateFromSupabase)
  const setLastSyncedAt     = useStore((s) => s.setLastSyncedAt)

  const [loading, setLoading] = useState(false)
  const syncingRef   = useRef(false)
  const mutatingRef  = useRef(false)   // true pendant addTask/addGoal/addDomain
  const bootDoneRef  = useRef(false)
  const userIdRef    = useRef<string | null>(null)

  // Exposé pour que le store puisse bloquer le sync pendant une mutation
  useEffect(() => {
    ;(window as any).__focusflowMutating = mutatingRef
  }, [])

  // ── Full sync — Supabase = source de vérité ──────────────────────────────
  const fullSync = useCallback(async (userId: string) => {
    // Ne jamais écraser le store pendant une mutation en cours
    if (syncingRef.current || mutatingRef.current) return
    syncingRef.current = true
    try {
      const [profile, domains, goals, tasks, customChallenges, activeChallenges] =
        await Promise.all([
          db.loadProfile(userId),
          db.loadDomains(userId),
          db.loadGoals(userId),
          db.loadTasks(userId),
          db.loadCustomChallenges(userId),
          db.loadActiveChallenges(userId),
        ])
      // Vérifier une dernière fois qu'aucune mutation n'a démarré pendant le fetch
      if (mutatingRef.current) {
        console.log('⚠️ fullSync annulé — mutation en cours')
        return
      }
      hydrateFromSupabase({ profile, domains, goals, tasks, customChallenges, activeChallenges })
      setLastSyncedAt(new Date().toISOString())
    } catch (err) {
      console.error('💥 fullSync erreur:', err)
    } finally {
      syncingRef.current = false
    }
  }, [hydrateFromSupabase, setLastSyncedAt])

  // ── Sync manuelle (bouton Resynchroniser) ────────────────────────────────
  const manualSync = useCallback(async () => {
    const userId = userIdRef.current
    if (!userId) return
    setLoading(true)
    try {
      await fullSync(userId)
    } finally {
      setLoading(false)
    }
  }, [fullSync])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    // ── Boot ────────────────────────────────────────────────────────────────
    const bootSync = async () => {
      try {
        const { data: { session }, error } = await supabase!.auth.getSession()
        if (session?.user) {
          setUserEmail(session.user.email ?? null)
          setSupabaseUser(session.user.id)
          userIdRef.current = session.user.id
          bootDoneRef.current = true
          setLoading(true)
          try { await fullSync(session.user.id) }
          finally { setLoading(false) }
        }
      } catch (err) {
        console.error('💥 bootSync erreur:', err)
      }
    }
    bootSync()

    // ── Auth state changes ───────────────────────────────────────────────────
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          if (bootDoneRef.current) { bootDoneRef.current = false; return }
          setUserEmail(session.user.email ?? null)
          setSupabaseUser(session.user.id)
          userIdRef.current = session.user.id
          setLoading(true)
          try { await fullSync(session.user.id) }
          finally { setLoading(false) }
        }
        if (event === 'SIGNED_OUT') {
          setSupabaseUser(null)
          setUserEmail(null)
          userIdRef.current = null
          bootDoneRef.current = false
          setLastSyncedAt('')
          if (typeof window !== 'undefined') localStorage.removeItem('focusflow-store-v10')
        }
      }
    )

    // ── Polling 60s ─────────────────────────────────────────────────────────
    const pollInterval = setInterval(() => {
      const userId = userIdRef.current
      if (userId) fullSync(userId)
    }, POLL_INTERVAL_MS)

    // ── Retour foreground mobile ─────────────────────────────────────────────
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const userId = userIdRef.current
        if (userId) fullSync(userId)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      subscription.unsubscribe()
      clearInterval(pollInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fullSync, setLastSyncedAt, setSupabaseUser, setUserEmail])

  return { loading, isOnline: isSupabaseConfigured, manualSync }
}

// Helper exporté pour que le store puisse signaler une mutation
export function setMutating(val: boolean) {
  if (typeof window !== 'undefined' && (window as any).__focusflowMutating) {
    (window as any).__focusflowMutating.current = val
  }
}
