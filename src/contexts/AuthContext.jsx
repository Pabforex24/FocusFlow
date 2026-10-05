import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { clearSnapshot, loadSnapshotOwner } from '../lib/snapshot.js'

// Hors-ligne avec une session expirée, Supabase ne peut pas la renouveler et la supprime : l'utilisateur serait renvoyé à la
// connexion alors que ses données sont disponibles sur l'appareil. On rouvre alors l'application avec le compte de la copie
// locale, en lecture seule (voir DataContext). Dès que le réseau revient, la vraie session est revérifiée.
async function offlineSession() {
  if (navigator.onLine !== false) return null
  const user = await loadSnapshotOwner()
  return user ? { user, offline: true } : null
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  // Vrai quand l'utilisateur arrive via le lien « mot de passe oublié ». Le lien du courriel contient « type=recovery » : on le lit tout de suite, car l'événement PASSWORD_RECOVERY peut partir
  // avant que l'écoute ci-dessous soit en place.
  const [recovery, setRecovery] = useState(() => /type=recovery/.test(window.location.hash))

  useEffect(() => {
    if (!supabase) return undefined
    let active = true
    supabase.auth.getSession()
      .then(async ({ data }) => data.session ?? offlineSession())
      .catch(() => offlineSession())
      .then((next) => {
        if (!active) return
        setSession(next)
        setLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      // Confidentialité : plus de copie locale après une déconnexion (même depuis un autre onglet). Hors-ligne, Supabase émet
      // lui-même SIGNED_OUT quand il ne peut pas renouveler une session expirée : on garde alors la copie (voir offlineSession).
      if (event === 'SIGNED_OUT' && navigator.onLine !== false) clearSnapshot()
      setSession(next)
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  // Session « hors-ligne » : au retour du réseau, on la remplace par la vraie (ou on renvoie à la connexion si elle est invalide).
  const offlineMode = Boolean(session?.offline)
  useEffect(() => {
    if (!supabase || !offlineMode) return undefined
    const onOnline = () => supabase.auth.getSession().then(({ data }) => setSession(data.session)).catch(() => {})
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [offlineMode])

  const value = useMemo(() => ({
    user: session?.user ?? null,
    loading,
    recovery,
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    },
    async signUp(email, password, displayName) {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName } } })
      if (error) throw error
      return { needsConfirmation: !data.session }
    },
    // Envoie un e-mail avec un lien de réinitialisation. L'adresse du site doit figurer dans
    // Supabase > Authentication > URL Configuration > Redirect URLs.
    async resetPassword(email) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
      if (error) throw error
    },
    async updatePassword(password) {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setRecovery(false)
    },
    async signOut() {
      const { error } = await supabase.auth.signOut()
      await clearSnapshot()
      if (error) throw error
    },
  }), [session, loading, recovery])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
