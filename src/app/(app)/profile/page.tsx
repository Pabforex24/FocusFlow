'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  User, Mail, Lock, LogOut, Eye, EyeOff, CheckCircle2,
  AlertCircle, Zap, Shield, Trash2, Camera, ChevronRight,
  Flame, Trophy, Star, Target,
} from 'lucide-react'
import { useStore } from '@/store'
import { supabase } from '@/lib/supabase'
import * as db from '@/lib/db'
import { PageHeader } from '@/components/layout/PageHeader'

export const dynamic = 'force-dynamic'

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(email: string | null, name?: string | null) {
  if (name) return name.slice(0, 2).toUpperCase()
  if (email) return email.slice(0, 2).toUpperCase()
  return '??'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, icon, children }: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(14,18,36,0.7)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div
        className="flex items-center gap-3 px-6 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span style={{ color: '#00E5B0' }}>{icon}</span>
        <span className="font-heading font-bold text-sm tracking-wide text-content">{title}</span>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block" style={{ color: '#3D4F6E' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputCls = `w-full rounded-xl px-4 py-3 text-sm font-medium transition-all outline-none`
const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#C8D6F0',
}
const inputFocusStyle = {
  border: '1px solid rgba(0,229,176,0.4)',
  background: 'rgba(0,229,176,0.04)',
}

function FeedbackMsg({ type, msg }: { type: 'success' | 'error'; msg: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
      style={
        type === 'success'
          ? { background: 'rgba(0,229,176,0.08)', border: '1px solid rgba(0,229,176,0.25)', color: '#00E5B0' }
          : { background: 'rgba(255,94,122,0.08)', border: '1px solid rgba(255,94,122,0.25)', color: '#FF5E7A' }
      }
    >
      {type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
      {msg}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router      = useRouter()
  const userEmail   = useStore((s: any) => s.userEmail as string | null)
  const userStats   = useStore((s) => s.userStats)
  const streak      = useStore((s) => s.streak)
  const badges      = useStore((s) => s.badges)
  const supabaseUserId = useStore((s) => s.supabaseUserId)
  const setSupabaseUser = useStore((s) => s.setSupabaseUser)

  // ── Identity ───────────────────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState(
    userEmail ? userEmail.split('@')[0] : ''
  )
  const [nameLoading, setNameLoading] = useState(false)
  const [nameFeedback, setNameFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const saveName = async () => {
    if (!supabase || !displayName.trim()) return
    setNameLoading(true); setNameFeedback(null)
    try {
      const { error } = await supabase.auth.updateUser({ data: { display_name: displayName.trim() } })
      if (error) throw error
      // Mettre à jour dans profiles Supabase
      if (supabaseUserId) {
        await supabase.from('profiles').update({ display_name: displayName.trim() }).eq('id', supabaseUserId)
      }
      setNameFeedback({ type: 'success', msg: 'Pseudo mis à jour ✓' })
    } catch (e: any) {
      setNameFeedback({ type: 'error', msg: e.message || 'Erreur lors de la mise à jour' })
    } finally {
      setNameLoading(false)
    }
  }

  // ── Password ───────────────────────────────────────────────────────────────
  const [newPwd, setNewPwd]         = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showPwd, setShowPwd]       = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdFeedback, setPwdFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [nameFocused, setNameFocused] = useState(false)
  const [pwdFocused, setPwdFocused]   = useState(false)
  const [cpwdFocused, setCpwdFocused] = useState(false)

  const savePwd = async () => {
    if (!supabase) return
    if (newPwd.length < 6) { setPwdFeedback({ type: 'error', msg: 'Minimum 6 caractères' }); return }
    if (newPwd !== confirmPwd) { setPwdFeedback({ type: 'error', msg: 'Les mots de passe ne correspondent pas' }); return }
    setPwdLoading(true); setPwdFeedback(null)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPwd })
      if (error) throw error
      setNewPwd(''); setConfirmPwd('')
      setPwdFeedback({ type: 'success', msg: 'Mot de passe mis à jour ✓' })
    } catch (e: any) {
      setPwdFeedback({ type: 'error', msg: e.message || 'Erreur lors de la mise à jour' })
    } finally {
      setPwdLoading(false)
    }
  }

  // ── Sign out ───────────────────────────────────────────────────────────────
  const [signOutLoading, setSignOutLoading] = useState(false)

  const handleSignOut = async () => {
    setSignOutLoading(true)
    await db.signOut()
    setSupabaseUser(null)
    router.push('/auth/login')
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const unlockedBadges = badges.filter((b) => b.unlockedAt)
  const initials = getInitials(userEmail, displayName)

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <PageHeader title="Mon profil" subtitle="Gérez vos informations personnelles" />

      <div className="max-w-2xl mx-auto px-4 pb-24 space-y-4" style={{ paddingTop: '24px' }}>

        {/* ── Avatar + stats banner ── */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(0,229,176,0.08) 0%, rgba(61,216,250,0.05) 100%)',
            border: '1px solid rgba(0,229,176,0.15)',
          }}
        >
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center font-heading font-extrabold text-xl"
                style={{
                  background: 'linear-gradient(135deg, #00E5B0, #3DD8FA)',
                  color: '#050812',
                  boxShadow: '0 0 24px rgba(0,229,176,0.35)',
                }}
              >
                {initials}
              </div>
              <div
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,229,176,0.15)', border: '1px solid rgba(0,229,176,0.3)' }}
              >
                <Zap size={10} style={{ color: '#00E5B0' }} />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-heading font-extrabold text-lg text-content truncate">
                {displayName || userEmail?.split('@')[0] || 'Utilisateur'}
              </p>
              <p className="text-xs truncate mb-3" style={{ color: '#4A5E80' }}>{userEmail || 'Mode offline'}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center"
                    style={{ background: 'rgba(0,229,176,0.12)' }}>
                    <Star size={10} style={{ color: '#00E5B0' }} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: '#00E5B0' }}>Nv.{userStats.level}</span>
                  <span className="text-xs" style={{ color: '#3D4F6E' }}>{userStats.xp} XP</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center"
                    style={{ background: 'rgba(200,134,90,0.12)' }}>
                    <Flame size={10} style={{ color: '#C8865A' }} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: '#C8865A' }}>{streak}j</span>
                  <span className="text-xs" style={{ color: '#3D4F6E' }}>streak</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center"
                    style={{ background: 'rgba(123,94,167,0.12)' }}>
                    <Trophy size={10} style={{ color: '#7B5EA7' }} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: '#7B5EA7' }}>{unlockedBadges.length}</span>
                  <span className="text-xs" style={{ color: '#3D4F6E' }}>badges</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center"
                    style={{ background: 'rgba(61,216,250,0.12)' }}>
                    <Target size={10} style={{ color: '#3DD8FA' }} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: '#3DD8FA' }}>{userStats.totalTasksDone}</span>
                  <span className="text-xs" style={{ color: '#3D4F6E' }}>tâches</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Identité ── */}
        <Section title="Identité" icon={<User size={15} />}>
          <Field label="Pseudo">
            <div className="relative">
              <input
                className={inputCls}
                style={nameFocused ? { ...inputStyle, ...inputFocusStyle } : inputStyle}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                placeholder="Votre pseudo"
                maxLength={30}
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono"
                style={{ color: '#3D4F6E' }}
              >
                {displayName.length}/30
              </span>
            </div>
          </Field>
          {nameFeedback && <FeedbackMsg {...nameFeedback} />}
          <button
            onClick={saveName}
            disabled={nameLoading || !displayName.trim()}
            className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg, #00E5B0, #3DD8FA)',
              color: '#050812',
              boxShadow: '0 0 20px rgba(0,229,176,0.20)',
            }}
          >
            {nameLoading ? 'Sauvegarde…' : '✓ Sauvegarder le profil'}
          </button>
        </Section>

        {/* ── Email ── */}
        <Section title="Adresse email" icon={<Mail size={15} />}>
          <Field label="Email">
            <input
              className={inputCls}
              style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }}
              value={userEmail || ''}
              readOnly
            />
          </Field>
          <p className="text-xs" style={{ color: '#3D4F6E' }}>
            Pour changer votre email, contactez le support.
          </p>
        </Section>

        {/* ── Mot de passe ── */}
        <Section title="Mot de passe" icon={<Lock size={15} />}>
          <Field label="Nouveau mot de passe">
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                className={inputCls + ' pr-10'}
                style={pwdFocused ? { ...inputStyle, ...inputFocusStyle } : inputStyle}
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                onFocus={() => setPwdFocused(true)}
                onBlur={() => setPwdFocused(false)}
                placeholder="6 caractères minimum"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#3D4F6E' }}
              >
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </Field>
          <Field label="Confirmer le mot de passe">
            <input
              type={showPwd ? 'text' : 'password'}
              className={inputCls}
              style={cpwdFocused ? { ...inputStyle, ...inputFocusStyle } : inputStyle}
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              onFocus={() => setCpwdFocused(true)}
              onBlur={() => setCpwdFocused(false)}
              placeholder="Répétez le mot de passe"
            />
          </Field>
          {/* Force indicator */}
          {newPwd.length > 0 && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1,2,3,4].map((i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-all duration-300"
                    style={{
                      background: newPwd.length >= i * 3
                        ? i <= 1 ? '#FF5E7A' : i <= 2 ? '#C8865A' : i <= 3 ? '#F4C542' : '#00E5B0'
                        : 'rgba(255,255,255,0.08)',
                    }}
                  />
                ))}
              </div>
              <p className="text-[10px]" style={{ color: '#3D4F6E' }}>
                {newPwd.length < 3 ? 'Très faible' : newPwd.length < 6 ? 'Faible' : newPwd.length < 9 ? 'Moyen' : 'Fort'}
              </p>
            </div>
          )}
          {pwdFeedback && <FeedbackMsg {...pwdFeedback} />}
          <button
            onClick={savePwd}
            disabled={pwdLoading || !newPwd || !confirmPwd}
            className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
            style={{
              background: 'rgba(123,94,167,0.15)',
              border: '1px solid rgba(123,94,167,0.3)',
              color: '#7B5EA7',
            }}
          >
            {pwdLoading ? 'Mise à jour…' : 'Changer le mot de passe'}
          </button>
        </Section>

        {/* ── Sécurité ── */}
        <Section title="Sécurité" icon={<Shield size={15} />}>
          <div
            className="flex items-center justify-between py-2 px-1 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(0,229,176,0.10)' }}>
                <Shield size={14} style={{ color: '#00E5B0' }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-content">Session active</p>
                <p className="text-[10px]" style={{ color: '#3D4F6E' }}>
                  Connecté via email · {userEmail}
                </p>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full" style={{ background: '#00E5B0', boxShadow: '0 0 6px #00E5B0' }} />
          </div>
        </Section>

        {/* ── Déconnexion ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(255,94,122,0.15)', background: 'rgba(255,94,122,0.03)' }}
        >
          <button
            onClick={handleSignOut}
            disabled={signOutLoading}
            className="w-full flex items-center justify-between px-6 py-5 transition-all hover:bg-white/5 disabled:opacity-50"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,94,122,0.12)' }}
              >
                <LogOut size={16} style={{ color: '#FF5E7A' }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold" style={{ color: '#FF5E7A' }}>
                  {signOutLoading ? 'Déconnexion…' : 'Se déconnecter'}
                </p>
                <p className="text-[10px]" style={{ color: '#4A5E80' }}>
                  Vous serez redirigé vers la page de connexion
                </p>
              </div>
            </div>
            <ChevronRight size={16} style={{ color: '#FF5E7A', opacity: 0.6 }} />
          </button>
        </div>

      </div>
    </div>
  )
}
