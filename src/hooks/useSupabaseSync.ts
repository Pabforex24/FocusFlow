'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useStore } from '@/store'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import * as db from '@/lib/db'

const POLL_INTERVAL_MS = 30_000

export function useSupabaseSync() {
  const setSupabaseUser     = useStore((s) => s.setSupabaseUser)
  const setUserEmail        = useStore((s: any) => s.setUserEmail as (email: string | null) => void)
  const hydrateFromSupabase = useStore((s) => s.hydrateFromSupabase)
  const setLastSyncedAt     = useStore((s) => s.setLastSyncedAt)

  const [loading, setLoading] = useState(false)
  const syncingRef  = useRef(false)
  const bootDoneRef = useRef(false)
  const userIdRef   = useRef<string | null>(null)

  // ── Full sync — source unique de vérité : Supabase ──────────────────────
  const fullSync = useCallback(async (userId: string) => {
    if (syncingRef.current) return
    syncingRef.current = true
    console.log('🔄 fullSync userId:', userId)
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
      console.log('✅ fullSync — domains:', domains.length, 'goals:', goals.length, 'tasks:', tasks.length)
      hydrateFromSupabase({ profile, domains, goals, tasks, customChallenges, activeChallenges })
      setLastSyncedAt(new Date().toISOString())
    } catch (err) {
      console.error('💥 fullSync erreur:', err)
    } finally {
      syncingRef.current = false
    }
  }, [hydrateFromSupabase, setLastSyncedAt])

  // ── Sync publique (bouton Resynchroniser) ─────────────────────────────────
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
    console.log('🔵 useSupabaseSync monté')
    if (!isSupabaseConfigured || !supabase) {
      console.log('❌ Supabase non configuré — sync désactivée')
      return
    }

    // ── Boot ────────────────────────────────────────────────────────────────
    const bootSync = async () => {
      try {
        const { data: { session }, error } = await supabase!.auth.getSession()
        console.log('📦 session user id:', session?.user?.id ?? 'null', 'error:', error)
        if (session?.user) {
          setUserEmail(session.user.email ?? null)
          setSupabaseUser(session.user.id)
          userIdRef.current = session.user.id
          bootDoneRef.current = true
          setLoading(true)
          try {
            await fullSync(session.user.id)
          } finally {
            setLoading(false)
          }
        }
      } catch (err) {
        console.error('💥 bootSync erreur:', err)
      }
    }
    bootSync()

    // ── Auth state changes ───────────────────────────────────────────────────
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 onAuthStateChange event:', event, 'user:', session?.user?.id ?? 'null')

        if (event === 'SIGNED_IN' && session?.user) {
          if (bootDoneRef.current) {
            bootDoneRef.current = false
            return
          }
          setUserEmail(session.user.email ?? null)
          setSupabaseUser(session.user.id)
          userIdRef.current = session.user.id
          setLoading(true)
          try {
            await fullSync(session.user.id)
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

    // ── Polling 30s ─────────────────────────────────────────────────────────
    const pollInterval = setInterval(async () => {
      const userId = userIdRef.current
      if (!userId) return
      console.log('⏱️ Poll sync userId:', userId)
      await fullSync(userId)
    }, POLL_INTERVAL_MS)

    // ── Retour foreground (mobile) ───────────────────────────────────────────
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const userId = userIdRef.current
        console.log('👁️ Retour foreground — userId:', userId ?? 'null')
        if (userId) await fullSync(userId)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      subscription.unsubscribe()
      clearInterval(pollInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fullSync, setLastSyncedAt, setSupabaseUser, setUserEmail])

  return {
    loading,
    isOnline: isSupabaseConfigured,
    manualSync,
  }
}
