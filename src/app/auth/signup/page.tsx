'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { signUpWithEmail } from '@/lib/db'
import { isSupabaseConfigured } from '@/lib/supabase'
import { inputCls } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'

export default function SignupPage() {
  const router = useRouter()
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [done,     setDone]     = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    if (password.length < 6) { setError('Le mot de passe doit faire au moins 6 caractères.'); return }
    setLoading(true); setError(null)
    try {
      const { error: authError } = await signUpWithEmail(email, password, name)
      if (authError) { setError(authError.message); return }
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 2500)
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription")
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
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7B5EA7, #C8865A)', boxShadow: '0 0 20px rgba(123,94,167,0.40)' }}
          >
            <Zap size={20} className="text-bg" strokeWidth={2.5} />
          </div>
          <span className="font-heading font-extrabold text-xl tracking-tight">
            Focus<span style={{ color: '#00E5B0' }}>Flow</span>
          </span>
        </div>

        {done ? (
          <div className="text-center py-8">
            <CheckCircle2 size={48} className="mx-auto mb-4" style={{ color: '#00E5B0' }} />
            <h2 className="font-heading font-extrabold text-xl mb-2">Compte créé !</h2>
            <p className="text-sm" style={{ color: '#7A8BAD' }}>
              Vérifiez votre email pour confirmer votre compte. Redirection en cours…
            </p>
          </div>
        ) : (
          <>
            <h1 className="font-heading font-extrabold text-2xl mb-1">Créer un compte</h1>
            <p className="text-sm mb-7" style={{ color: '#7A8BAD' }}>Commencez votre parcours de discipline 🚀</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: '#3D4F6E' }}>
                  Prénom (optionnel)
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#3D4F6E' }} />
                  <input className={cn(inputCls, 'pl-9')} value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre prénom" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: '#3D4F6E' }}>Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#3D4F6E' }} />
                  <input type="email" className={cn(inputCls, 'pl-9')} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" required />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: '#3D4F6E' }}>Mot de passe</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#3D4F6E' }} />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className={cn(inputCls, 'pl-9 pr-10')}
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="6 caractères minimum" required
                  />
                  <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#3D4F6E' }}>
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm" style={{ background: 'rgba(255,94,122,0.08)', border: '1px solid rgba(255,94,122,0.25)', color: '#FF5E7A' }}>
                  <AlertCircle size={14} className="flex-shrink-0" /> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !isSupabaseConfigured}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 mt-2"
                style={{ background: 'linear-gradient(135deg, #7B5EA7, #C8865A)', color: '#fff', boxShadow: '0 0 20px rgba(123,94,167,0.30)' }}
              >
                {loading ? 'Création…' : 'Créer mon compte'}
              </button>
            </form>

            <p className="text-center text-sm mt-6" style={{ color: '#3D4F6E' }}>
              Déjà un compte ?{' '}
              <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: '#00E5B0' }}>Se connecter</Link>
            </p>
            <p className="text-center text-xs mt-3" style={{ color: '#1E2A40' }}>
              <Link href="/dashboard" className="hover:underline">Continuer sans compte →</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
