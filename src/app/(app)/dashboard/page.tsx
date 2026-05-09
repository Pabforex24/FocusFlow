'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Flame, Zap, TrendingUp, Timer, ArrowRight,
  CheckCircle2, Target, ListTodo, Trophy, Sparkles, CheckSquare,
} from 'lucide-react'
import { useStore } from '@/store'
import { getGreeting, hexToRgba } from '@/lib/utils'
import { ProgressBar, RingProgress } from '@/components/ui/ProgressBar'
import { DomainIcon } from '@/components/domain/DomainIcon'
import { XPBar } from '@/components/gamification/XPBar'
import { FocusMode } from '@/components/focus/FocusMode'
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

  const [showFocus, setShowFocus] = useState(false)

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
          onClick={() => setShowFocus(true)}
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
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading font-bold text-sm uppercase tracking-widest" style={{ color: '#7A8BAD' }}>
              Mes domaines
            </h2>
            <p className="text-[10px] mt-0.5" style={{ color: '#1E2A40' }}>
              {domains.length} domaine{domains.length !== 1 ? 's' : ''} · progression globale
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Score global compact */}
            <div className="text-right">
              <div className="font-heading font-extrabold text-2xl leading-none" style={{ color: '#00E5B0' }}>
                {globalPct}%
              </div>
              <div className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: '#3D4F6E' }}>global</div>
            </div>
            <RingProgress value={globalPct} size={46} strokeWidth={4} color="#00E5B0">
              <TrendingUp size={12} color="#00E5B0" />
            </RingProgress>
          </div>
        </div>

        {/* Barre globale fine */}
        <ProgressBar value={globalPct} color="#00E5B0" height="sm" className="mb-5" />

        {domains.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: '#3D4F6E' }}>
            <Link href="/domains" className="hover:underline" style={{ color: '#00E5B0' }}>
              Créer un domaine →
            </Link>
          </p>
        ) : (
          <div className="space-y-2">
            {domains.map((domain) => {
              const pct           = getDomainProgress(domain.id)
              const domainGoals   = goals.filter((g) => g.domainId === domain.id)
              const domainTasks   = tasks.filter((t) => t.domainId === domain.id)
              const todayDomainTasks = domainTasks.filter(
                (t) => new Date(t.scheduledAt).toDateString() === today.toDateString()
              )
              const doneTodayDomain = todayDomainTasks.filter((t) => t.done)
              const completedGoals  = domainGoals.filter((g) => {
                const gt = tasks.filter((t) => t.goalId === g.id)
                return gt.length > 0 && gt.every((t) => t.done)
              })

              // Status badge
              const statusColor =
                pct === 100 ? '#00E5B0' :
                pct >= 60   ? '#3DD8FA' :
                pct >= 30   ? '#C8865A' : '#FF5E7A'
              const statusLabel =
                pct === 100 ? 'Complété' :
                pct >= 60   ? 'En bonne voie' :
                pct >= 30   ? 'En cours' : 'À relancer'

              return (
                <Link
                  key={domain.id}
                  href={`/goals?domain=${domain.id}`}
                  className="block group rounded-xl p-3.5 transition-all hover:scale-[1.01]"
                  style={{
                    background: `linear-gradient(135deg, ${hexToRgba(domain.color, 0.06)} 0%, rgba(9,13,26,0.60) 100%)`,
                    border: `1px solid ${hexToRgba(domain.color, 0.14)}`,
                  }}
                >
                  {/* Row 1 : icon + nom + statut + flèche */}
                  <div className="flex items-center gap-3 mb-3">
                    {/* Icone domain */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: hexToRgba(domain.color, 0.15),
                        boxShadow: `0 0 12px ${hexToRgba(domain.color, 0.20)}`,
                      }}
                    >
                      <DomainIcon name={domain.icon} size={16} color={domain.color} />
                    </div>

                    {/* Nom + statut */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate text-content group-hover:opacity-80 transition-opacity">
                          {domain.name}
                        </span>
                        {/* Badge statut */}
                        <span
                          className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{
                            background: hexToRgba(statusColor, 0.15),
                            color: statusColor,
                            border: `1px solid ${hexToRgba(statusColor, 0.25)}`,
                          }}
                        >
                          {statusLabel}
                        </span>
                      </div>
                      {/* Mini stats */}
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] flex items-center gap-1" style={{ color: '#3D4F6E' }}>
                          <Target size={9} />
                          {completedGoals.length}/{domainGoals.length} obj.
                        </span>
                        {todayDomainTasks.length > 0 && (
                          <span className="text-[10px] flex items-center gap-1" style={{ color: '#3D4F6E' }}>
                            <CheckSquare size={9} />
                            {doneTodayDomain.length}/{todayDomainTasks.length} auj.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* % + flèche */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className="font-heading font-extrabold text-base leading-none"
                        style={{ color: domain.color }}
                      >
                        {pct}%
                      </span>
                      <ArrowRight
                        size={13}
                        className="opacity-0 group-hover:opacity-60 transition-opacity"
                        style={{ color: domain.color }}
                      />
                    </div>
                  </div>

                  {/* Barre de progression */}
                  <div className="relative">
                    <ProgressBar value={pct} color={domain.color} height="sm" glow />
                    {/* Marqueur 50% si pas encore atteint */}
                    {pct < 50 && (
                      <div
                        className="absolute top-0 h-full w-px opacity-20"
                        style={{ left: '50%', background: domain.color }}
                      />
                    )}
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

      {showFocus && <FocusMode onClose={() => setShowFocus(false)} />}
    </div>
  )
}
