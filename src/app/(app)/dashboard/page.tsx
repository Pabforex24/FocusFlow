'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import {
  Flame, Zap, TrendingUp, Timer, ArrowRight,
  CheckCircle2, Target, ListTodo, Trophy, Sparkles,
} from 'lucide-react'
import { useStore } from '@/store'
import { getGreeting, hexToRgba } from '@/lib/utils'
import { ProgressBar, RingProgress } from '@/components/ui/ProgressBar'
import { DomainIcon } from '@/components/domain/DomainIcon'
import { XPBar } from '@/components/gamification/XPBar'
import { Onboarding } from '@/components/onboarding/Onboarding'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function DashboardPage() {
  const {
    domains, goals, tasks, streak, userStats, focusSession,
    activeChallenges,
    getDomainProgress, getGlobalProgress,
    updateStreak, applyDailyPenalty,
    onboarding,
  } = useStore()

  const openFocusModal = useStore((s) => s.openFocusModal)

  useEffect(() => {
    updateStreak()
    applyDailyPenalty()
  }, [])

  const today       = new Date()
  const todayStr    = today.toDateString()
  const todayTasks  = tasks.filter((t) => new Date(t.scheduledAt).toDateString() === todayStr)
  const doneTasks   = todayTasks.filter((t) => t.done)
  const todayPct    = todayTasks.length ? Math.round((doneTasks.length / todayTasks.length) * 100) : 0
  const globalPct   = getGlobalProgress()
  const hasFocus    = focusSession?.status === 'running' || focusSession?.status === 'paused'
  const activeCount = activeChallenges?.filter((c) => c.isActive).length ?? 0

  if (!onboarding.completed) return <Onboarding />

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto page-enter pb-24 md:pb-8 space-y-6">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl tracking-tight">
            {getGreeting()} 👋
          </h1>
          <p className="text-sm mt-0.5 capitalize" style={{ color: '#3D4F6E' }}>
            {format(today, 'EEEE d MMMM', { locale: fr })}
          </p>
        </div>

        {/* Focus button */}
        <button
          onClick={() => openFocusModal()}
          className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all mt-1"
          style={{
            background:  hasFocus ? 'rgba(0,229,176,0.12)' : 'rgba(123,94,167,0.10)',
            borderColor: hasFocus ? 'rgba(0,229,176,0.30)' : 'rgba(123,94,167,0.28)',
            color:       hasFocus ? '#00E5B0' : '#7B5EA7',
            boxShadow:   hasFocus ? '0 0 14px rgba(0,229,176,0.18)' : '0 0 14px rgba(123,94,167,0.14)',
          }}
        >
          <Timer size={13} strokeWidth={1.75} />
          {hasFocus ? 'Focus actif' : 'Focus'}
        </button>
      </div>

      {/* ── XP Bar ─────────────────────────────────────────────────── */}
      <XPBar compact />

      {/* ── 4 KPI cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Aujourd'hui",
            value: `${doneTasks.length}/${todayTasks.length}`,
            sub: 'tâches',
            icon: <CheckCircle2 size={15} strokeWidth={1.75} />,
            color: '#00E5B0',
            href: '/tasks',
          },
          {
            label: 'Streak',
            value: streak,
            sub: 'jours consécutifs',
            icon: <Flame size={15} strokeWidth={1.75} />,
            color: '#C8865A',
            href: null,
          },
          {
            label: 'Niveau',
            value: userStats.level,
            sub: `${userStats.xp} XP`,
            icon: <Zap size={15} strokeWidth={1.75} />,
            color: '#7B5EA7',
            href: null,
          },
          {
            label: 'Global',
            value: `${globalPct}%`,
            sub: 'progression',
            icon: <TrendingUp size={15} strokeWidth={1.75} />,
            color: '#3DD8FA',
            href: '/goals',
          },
        ].map((card) => {
          const inner = (
            <div
              className="rounded-2xl p-4 h-full transition-all"
              style={{
                background: `linear-gradient(145deg, rgba(14,18,36,0.90) 0%, rgba(9,13,26,0.95) 100%)`,
                border: `1px solid ${hexToRgba(card.color, 0.18)}`,
                boxShadow: `0 4px 24px rgba(0,0,0,0.45), inset 0 0 24px ${hexToRgba(card.color, 0.03)}`,
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center mb-3"
                style={{ background: hexToRgba(card.color, 0.14), color: card.color, boxShadow: `0 0 10px ${hexToRgba(card.color, 0.20)}` }}
              >
                {card.icon}
              </div>
              <div className="font-heading font-extrabold text-xl leading-none mb-1" style={{ color: card.color }}>
                {card.value}
              </div>
              <div className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: '#3D4F6E' }}>
                {card.label}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: '#1E2A40' }}>{card.sub}</div>
            </div>
          )
          return card.href ? (
            <Link key={card.label} href={card.href} className="block group hover:scale-[1.02] transition-transform">
              {inner}
            </Link>
          ) : (
            <div key={card.label}>{inner}</div>
          )
        })}
      </div>

      {/* ── Progression par domaine ─────────────────────────────────── */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'linear-gradient(145deg, rgba(14,18,36,0.90) 0%, rgba(9,13,26,0.95) 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 4px 32px rgba(0,0,0,0.50)',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-bold text-sm uppercase tracking-widest" style={{ color: '#7A8BAD' }}>
            Mes domaines
          </h2>
          <Link href="/domains" className="text-[11px] flex items-center gap-1 transition-colors hover:opacity-80" style={{ color: '#3D4F6E' }}>
            Voir tout <ArrowRight size={11} />
          </Link>
        </div>

        {/* Barre globale */}
        <div className="flex items-center gap-4 mb-5">
          <div className="flex-1">
            <div className="flex items-end justify-between mb-2">
              <span className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: '#3D4F6E' }}>Progression globale</span>
              <span className="font-heading font-extrabold text-2xl leading-none" style={{ color: '#00E5B0' }}>{globalPct}%</span>
            </div>
            <ProgressBar value={globalPct} color="#00E5B0" height="lg" />
          </div>
        </div>

        {domains.length === 0 ? (
          <p className="text-xs text-center py-3" style={{ color: '#3D4F6E' }}>
            <Link href="/domains" className="hover:underline" style={{ color: '#00E5B0' }}>Créer un domaine →</Link>
          </p>
        ) : (
          <div className="space-y-4">
            {domains.map((domain) => {
              const pct = getDomainProgress(domain.id)
              const goalCount = goals.filter((g) => g.domainId === domain.id).length
              return (
                <Link key={domain.id} href={`/goals?domain=${domain.id}`} className="block group">
                  <div className="flex items-center gap-3">
                    <RingProgress value={pct} size={40} strokeWidth={3} color={domain.color}>
                      <span className="text-[8px] font-bold" style={{ color: domain.color }}>{pct}%</span>
                    </RingProgress>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <DomainIcon name={domain.icon} size={12} color={domain.color} />
                          <span className="text-sm font-semibold text-content truncate group-hover:opacity-80 transition-opacity">
                            {domain.name}
                          </span>
                          <span className="text-[10px]" style={{ color: '#2e3d5e' }}>
                            {goalCount} obj.
                          </span>
                        </div>
                        <ArrowRight size={11} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#3D4F6E' }} />
                      </div>
                      <ProgressBar value={pct} color={domain.color} height="sm" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Raccourcis vers les sections ────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            href: '/tasks',
            icon: <ListTodo size={18} strokeWidth={1.75} />,
            color: '#00E5B0',
            label: 'Tâches du jour',
            value: todayPct === 100
              ? '✓ Tout fait !'
              : `${doneTasks.length} / ${todayTasks.length} faites`,
            sub: todayTasks.length === 0 ? 'Rien de planifié' : `${100 - todayPct}% restant`,
            progress: todayPct,
          },
          {
            href: '/goals',
            icon: <Target size={18} strokeWidth={1.75} />,
            color: '#3DD8FA',
            label: 'Objectifs',
            value: goals.length,
            sub: `${goals.filter(g => {
              const ts = tasks.filter(t => t.goalId === g.id)
              return ts.length > 0 && ts.every(t => t.done)
            }).length} complétés`,
            progress: null,
          },
          {
            href: '/challenges',
            icon: <Trophy size={18} strokeWidth={1.75} />,
            color: '#C8865A',
            label: 'Challenges',
            value: activeCount,
            sub: activeCount === 0 ? 'Aucun actif' : `${activeCount} en cours`,
            progress: null,
          },
          {
            href: '/coach',
            icon: <Sparkles size={18} strokeWidth={1.75} />,
            color: '#7B5EA7',
            label: 'Coach IA',
            value: '→',
            sub: 'Insights & conseils',
            progress: null,
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-2xl p-4 flex flex-col gap-2 transition-all hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(145deg, rgba(14,18,36,0.90) 0%, rgba(9,13,26,0.95) 100%)',
              border: `1px solid ${hexToRgba(item.color, 0.15)}`,
              boxShadow: `0 4px 20px rgba(0,0,0,0.40)`,
            }}
          >
            <div className="flex items-center justify-between">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: hexToRgba(item.color, 0.14), color: item.color }}
              >
                {item.icon}
              </div>
              <ArrowRight size={13} className="opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: item.color }} />
            </div>

            <div>
              <div className="font-heading font-extrabold text-lg leading-none" style={{ color: item.color }}>
                {item.value}
              </div>
              <div className="text-[10px] uppercase tracking-widest font-semibold mt-0.5" style={{ color: '#3D4F6E' }}>
                {item.label}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: '#1E2A40' }}>{item.sub}</div>
            </div>

            {item.progress !== null && (
              <ProgressBar value={item.progress} color={item.color} height="sm" />
            )}
          </Link>
        ))}
      </div>

    </div>
  )
}
