'use client'

import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/store'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import * as db from '@/lib/db'

/**
 * useSupabaseSync
 * ───────────────
 * - Écoute les changements d'auth (login / logout)
 * - Au login : charge toutes les données depuis Supabase et les injecte dans le store
 * - Expose userId, loading, et isOnline (Supabase configuré)
 *
 * Le store Zustand reste la source de vérité UI.
 * Les actions du store appellent db.* en arrière-plan pour persister.
 */
export function useSupabaseSync() {
  const setSupabaseUser    = useStore((s) => s.setSupabaseUser)
  const hydrateFromSupabase = useStore((s) => s.hydrateFromSupabase)
  const [loading, setLoading] = useState(false)
  const initialized = useRef(false)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    // ── Check existing session on mount ────────────────────────────────────
    const loadInitial = async () => {
      if (initialized.current) return
      initialized.current = true
      const { data: { session } } = await supabase!.auth.getSession()
      if (session?.user) {
        setLoading(true)
        try {
          await loadUserData(session.user.id)
        } finally {
          setLoading(false)
        }
      }
    }
    loadInitial()

    // ── Auth state listener ─────────────────────────────────────────────────
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setLoading(true)
          try {
            await loadUserData(session.user.id)
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

  async function loadUserData(userId: string) {
    setSupabaseUser(userId)

    const [profile, domains, goals, tasks, customChallenges, activeChallenges] =
      await Promise.all([
        db.loadProfile(userId),
        db.loadDomains(userId),
        db.loadGoals(userId),
        db.loadTasks(userId),
        db.loadCustomChallenges(userId),
        db.loadActiveChallenges(userId),
      ])

    hydrateFromSupabase({
      profile,
      domains,
      goals,
      tasks,
      customChallenges,
      activeChallenges,
    })
  }

  return {
    loading,
    isOnline: isSupabaseConfigured,
  }
}
