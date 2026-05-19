'use client'

import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/store'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import * as db from '@/lib/db'
import type { Domain, Goal, Task, Challenge, ActiveChallenge } from '@/types'

const POLL_INTERVAL_MS = 30_000

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
  const userIdRef   = useRef<string | null>(null)

  useEffect(() => {
    console.log('🔵 useSupabaseSync monté')
    console.log('📋 isSupabaseConfigured:', isSupabaseConfigured)
    console.log('📋 supabase client:', supabase ? 'OK' : 'NULL')

    if (!isSupabaseConfigured || !supabase) {
      console.log('❌ Supabase non configuré — sync désactivée')
      return
    }

    const bootSync = async () => {
      console.log('🔍 bootSync lancé')
      try {
        const { data: { session }, error } = await supabase!.auth.getSession()
        console.log('📦 getSession error:', error)
        console.log('📦 session user id:', session?.user?.id ?? 'null')

        if (session?.user) {
          setUserEmail(session.user.email ?? null)
          setSupabaseUser(session.user.id)
          userIdRef.current = session.user.id
          setLoading(true)
          try {
            await syncUserData(session.user.id, false)
          } finally {
            setLoading(false)
          }
          // APRÈS la sync — signale à SIGNED_IN que le boot est terminé
          bootDoneRef.current = true
        } else {
          console.log('⚠️ Pas de session active au boot')
        }
      } catch (err) {
        console.error('💥 bootSync erreur:', err)
      }
    }
    bootSync()

    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 onAuthStateChange event:', event, 'user:', session?.user?.id ?? 'null')

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

    const pollInterval = setInterval(async () => {
      const userId = userIdRef.current
      if (!userId) return
      console.log('⏱️ Poll sync pour userId:', userId)
      await syncUserData(userId, false)
    }, POLL_INTERVAL_MS)

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const userId = userIdRef.current
        console.log('👁️ Retour foreground — userId:', userId ?? 'null')
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

  async function syncUserData(userId: string, forceFullSync: boolean) {
    console.log('🔄 syncUserData userId:', userId, 'forceFullSync:', forceFullSync)

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

      // Force full sync si : jamais syncé OU login explicite OU dernière sync > 24h
      const syncAge = lastSyncedAt ? Date.now() - new Date(lastSyncedAt).getTime() : Infinity
      const isFirstSync = !lastSyncedAt || forceFullSync || syncAge > 24 * 60 * 60 * 1000

      console.log('📅 lastSyncedAt:', lastSyncedAt, '— isFirstSync:', isFirstSync, '— age(min):', Math.round(syncAge / 60000))

      if (isFirstSync) {
        const local = useStore.getState()
        const hasLocalData = local.domains.length > 0 || local.tasks.length > 0 ||
          local.goals.length > 0 || local.customChallenges?.length > 0
        console.log('📤 hasLocalData à uploader:', hasLocalData, '— domains:', local.domains.length, 'tasks:', local.tasks.length)
        if (hasLocalData) {
          await uploadLocalData(userId, local)
        }

        console.log('📥 Full sync depuis Supabase...')
        const [profile, domains, goals, tasks, customChallenges, activeChallenges] =
          await Promise.all([
            db.loadProfile(userId),
            db.loadDomains(userId),
            db.loadGoals(userId),
            db.loadTasks(userId),
            db.loadCustomChallenges(userId),
            db.loadActiveChallenges(userId),
          ])
        console.log('✅ Full sync résultat — domains:', domains.length, 'goals:', goals.length, 'tasks:', tasks.length)
        hydrateFromSupabase({ profile, domains, goals, tasks, customChallenges, activeChallenges })
        setLastSyncedAt(syncStart)
        return
      }

      // Buffer de 5s sur le since pour éviter de manquer les changements concurrents
      const sinceSafe = new Date(new Date(lastSyncedAt).getTime() - 5000).toISOString()
      console.log('📥 Delta sync depuis sinceSafe:', sinceSafe)
      const [profile, domains, goals, tasks, customChallenges, activeChallenges] =
        await Promise.all([
          db.loadProfile(userId),
          db.loadDomainsSince(userId, sinceSafe),
          db.loadGoalsSince(userId, sinceSafe),
          db.loadTasksSince(userId, sinceSafe),
          db.loadCustomChallengesSince(userId, sinceSafe),
          db.loadActiveChallengesSince(userId, sinceSafe),
        ])
      console.log('✅ Delta sync résultat — domains:', domains.length, 'goals:', goals.length, 'tasks:', tasks.length)
      mergeFromSupabase({ profile, domains, goals, tasks, customChallenges, activeChallenges })
      setLastSyncedAt(syncStart)

    } catch (err) {
      console.error('💥 syncUserData erreur:', err)
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
