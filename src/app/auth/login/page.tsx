'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { Zap, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { signInWithEmail } from '@/lib/db'
import { isSupabaseConfigured } from '@/lib/supabase'
import { inputCls } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const nextPath     = searchParams.get('next') || '/dashboard'
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true); setError(null)
    try {
      const { data, error: authError } = await signInWithEmail(email, password)
      if (authError) {
        // Traduire les erreurs Supabase en français
        const msg = authError.message.includes('Invalid login credentials')
          ? 'Email ou mot de passe incorrect.'
          : authError.message.includes('Email not confirmed')
          ? 'Email non confirmé. Vérifie ta boîte mail.'
          : authError.message.includes('Too many requests')
          ? 'Trop de tentatives. Réessaie dans quelques minutes.'
          : authError.message
        setError(msg)
        return
      }
      // Session établie — attendre un tick pour que onAuthStateChange se déclenche
      if (data?.session) {
        setTimeout(() => router.push(nextPath), 100)
      } else {
        router.push(nextPath)
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div
        className="w-full max-w-md rounded-3xl p-8 animate-scale-in"
        style={{
          background: 'linear-gradient(145deg, rgba(14,18,36,0.95) 0%, rgba(9,13,26,0.98) 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.70)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00E5B0, #3DD8FA)', boxShadow: '0 0 20px rgba(0,229,176,0.40)' }}
          >
            <Zap size={20} className="text-bg" strokeWidth={2.5} />
          </div>
          <span className="font-heading font-extrabold text-xl tracking-tight">
            Focus<span style={{ color: '#00E5B0' }}>Flow</span>
          </span>
        </div>

        <h1 className="font-heading font-extrabold text-2xl mb-1">Connexion</h1>
        <p className="text-sm mb-7" style={{ color: '#7A8BAD' }}>Bon retour parmi nous 👋</p>

        {!isSupabaseConfigured && (
          <div
            className="flex items-start gap-2 rounded-xl px-4 py-3 mb-5 text-sm"
            style={{ background: 'rgba(200,134,90,0.08)', border: '1px solid rgba(200,134,90,0.25)', color: '#C8865A' }}
          >
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>Supabase non configuré — ajoutez vos variables d'environnement.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: '#3D4F6E' }}>
              Email
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#3D4F6E' }} />
              <input
                type="email"
                className={cn(inputCls, 'pl-9')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: '#3D4F6E' }}>
              Mot de passe
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#3D4F6E' }} />
              <input
                type={showPwd ? 'text' : 'password'}
                className={cn(inputCls, 'pl-9 pr-10')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: '#3D4F6E' }}
              >
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm"
              style={{ background: 'rgba(255,94,122,0.08)', border: '1px solid rgba(255,94,122,0.25)', color: '#FF5E7A' }}
            >
              <AlertCircle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isSupabaseConfigured}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 mt-2"
            style={{
              background: 'linear-gradient(135deg, #00E5B0, #3DD8FA)',
              color: '#050812',
              boxShadow: '0 0 20px rgba(0,229,176,0.30)',
            }}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: '#3D4F6E' }}>
          Pas encore de compte ?{' '}
          <Link href="/auth/signup" className="font-semibold hover:underline" style={{ color: '#00E5B0' }}>
            Créer un compte
          </Link>
        </p>

        <p className="text-center text-xs mt-4" style={{ color: '#1E2A40' }}>
          <Link href="/dashboard" className="hover:underline">
            Continuer sans compte →
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
