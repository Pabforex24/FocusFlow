import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

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
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    }).catch(() => { if (active) setLoading(false) })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      setSession(next)
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [])

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
      if (error) throw error
    },
  }), [session, loading, recovery])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
