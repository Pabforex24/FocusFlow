'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useStore } from '@/store'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import * as db from '@/lib/db'

const POLL_INTERVAL_MS = 60_000
const BOOT_DELAY_MS    = 800

export function useSupabaseSync() {
  const setSupabaseUser     = useStore((s) => s.setSupabaseUser)
  const setUserEmail        = useStore((s: any) => s.setUserEmail as (e: string | null) => void)
  const hydrateFromSupabase = useStore((s) => s.hydrateFromSupabase)
  const setLastSyncedAt     = useStore((s) => s.setLastSyncedAt)

  const [loading, setLoading] = useState(false)
  const syncingRef  = useRef(false)
  const userIdRef   = useRef<string | null>(null)
  const bootDoneRef = useRef(false)

  const isInserting = () => useStore.getState().isInserting

  const fullSync = useCallback(async (userId: string, source = 'unknown') => {
    if (syncingRef.current) return
    if (isInserting()) {
      console.log('[sync] bloqué — insert en cours')
      return
    }
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
      if (isInserting()) return
      hydrateFromSupabase({ profile, domains, goals, tasks, customChallenges, activeChallenges })
      setLastSyncedAt(new Date().toISOString())
    } catch (err) {
      console.error('[sync] erreur:', err)
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
          userIdRef.current   = session.user.id
          bootDoneRef.current = true
          setLoading(true)
          await new Promise((r) => setTimeout(r, BOOT_DELAY_MS))
          try { await fullSync(session.user.id, 'boot') }
          finally { setLoading(false) }
        }
      } catch (err) {
        console.error('[sync] boot error:', err)
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
          if (typeof window !== 'undefined') localStorage.removeItem('focusflow-store-v11')
        }
      }
    )

    const poll = setInterval(() => {
      if (userIdRef.current) fullSync(userIdRef.current, 'poll')
    }, POLL_INTERVAL_MS)

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
