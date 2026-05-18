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
          bootDoneRef.current = true
          setLoading(true)
          try {
            await syncUserData(session.user.id, false)
          } finally {
            setLoading(false)
          }
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
          // ⚠️ NE PAS purger le localStorage ici
          // Les données locales doivent survivre à la déconnexion pour être
          // uploadées lors de la prochaine reconnexion via uploadLocalData()
          // On purge UNIQUEMENT après un upload réussi dans syncUserData()
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
      const isFirstSync  = !lastSyncedAt || forceFullSync

      console.log('📅 lastSyncedAt:', lastSyncedAt, '— isFirstSync:', isFirstSync)

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

      console.log('📥 Delta sync depuis lastSyncedAt:', lastSyncedAt)
      const [profile, domains, goals, tasks, customChallenges, activeChallenges] =
        await Promise.all([
          db.loadProfile(userId),
          db.loadDomainsSince(userId, lastSyncedAt),
          db.loadGoalsSince(userId, lastSyncedAt),
          db.loadTasksSince(userId, lastSyncedAt),
          db.loadCustomChallengesSince(userId, lastSyncedAt),
          db.loadActiveChallengesSince(userId, lastSyncedAt),
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
    console.log('📤 uploadLocalData — domains:', local.domains.length, 'goals:', local.goals.length, 'tasks:', local.tasks.length)

    // Ordre important : domains → goals → tasks (FK dependencies)
    const results = await Promise.allSettled([
      ...local.domains.map((d: Domain) =>
        supabase!.from('domains').upsert({
          id: d.id, user_id: userId,
          name: d.name, icon: d.icon, color: d.color,
          created_at: d.createdAt,
        }, { onConflict: 'id' })
      ),
    ])

    // Goals après domains
    await Promise.allSettled([
      ...local.goals.map((g: Goal) =>
        supabase!.from('goals').upsert({
          id: g.id, user_id: userId,
          domain_id: g.domainId,
          title: g.title,
          description: g.description || null,
          unit: g.unit || null,
          challenge_id: g.challengeId || null,
          created_at: g.createdAt,
        }, { onConflict: 'id' })
      ),
    ])

    // Tasks après goals
    await Promise.allSettled([
      ...local.tasks.map((t: Task) =>
        supabase!.from('tasks').upsert({
          id: t.id, user_id: userId,
          domain_id: t.domainId || null,
          goal_id: t.goalId || null,
          challenge_active_id: t.challengeActiveId || null,
          title: t.title,
          duration: t.duration || null,
          scheduled_at: t.scheduledAt,
          done: t.done,
          done_at: t.doneAt || null,
          xp_value: t.xpValue,
          priority: t.priority || null,
          frequency: t.frequency || null,
          custom_days: t.customDays || null,
          is_generated: t.isGenerated ?? false,
          created_at: t.createdAt,
        }, { onConflict: 'id' })
      ),
    ])

    // Custom challenges et active challenges
    await Promise.allSettled([
      ...(local.customChallenges || []).map((c: Challenge) =>
        db.upsertCustomChallenge(userId, c).catch(() => {})
      ),
      ...(local.activeChallenges || []).map((ac: ActiveChallenge) =>
        db.insertActiveChallenge(userId, ac).catch(() => {})
      ),
    ])

    const errors = results.filter((r) => r.status === 'rejected')
    if (errors.length > 0) {
      console.warn('[sync] uploadLocalData — quelques erreurs:', errors.length)
    } else {
      console.log('✅ uploadLocalData terminé sans erreur')
    }
  }

  return {
    loading,
    isOnline: isSupabaseConfigured,
  }
}
