'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, CheckSquare, Target, Flame, Globe, Plus, ArrowRight, Timer, Zap, Trophy, Star } from 'lucide-react'
import { useStore } from '@/store'
import { getGreeting, hexToRgba } from '@/lib/utils'
import { ProgressBar, RingProgress } from '@/components/ui/ProgressBar'
import { DomainIcon } from '@/components/domain/DomainIcon'
import { TaskItem } from '@/components/task/TaskItem'
import { ChallengeDashboardWidget } from '@/components/challenge/ChallengeDashboardWidget'
import { XPBar } from '@/components/gamification/XPBar'
import { BadgesWidget } from '@/components/gamification/BadgesWidget'
import { FocusMode } from '@/components/focus/FocusMode'
import { Onboarding } from '@/components/onboarding/Onboarding'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function DashboardPage() {
  const {
    domains, goals, tasks, streak, userStats, focusSession,
    toggleTask, deleteTask,
    getDomainProgress, getGlobalProgress, getTop3Tasks,
    updateStreak, applyDailyPenalty,
    onboarding,
  } = useStore()

  const [showFocus, setShowFocus] = useState(false)

  useEffect(() => {
    updateStreak()
    applyDailyPenalty()
  }, [])

  const today = new Date()
  const todayStr = today.toDateString()
  const todayTasks = tasks.filter((t) => new Date(t.scheduledAt).toDateString() === todayStr && !t.challengeActiveId)
  const doneTasks = todayTasks.filter((t) => t.done)
  const globalPct = getGlobalProgress()
  const top3 = getTop3Tasks()
  const hasFocusRunning = focusSession?.status === 'running' || focusSession?.status === 'paused'

  if (!onboarding.completed) return <Onboarding />

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto page-enter pb-24 md:pb-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl tracking-tight">
            {getGreeting()} 👋
          </h1>
          <p className="text-content-3 text-sm mt-0.5 capitalize">
            {format(today, 'EEEE d MMMM', { locale: fr })}
          </p>
        </div>
        {/* Focus CTA */}
        <button
          onClick={() => setShowFocus(true)}
          className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all mt-1"
          style={{
            background: hasFocusRunning ? 'rgba(0,194,168,0.15)' : 'rgba(123,97,255,0.12)',
            borderColor: hasFocusRunning ? 'rgba(0,194,168,0.4)' : 'rgba(123,97,255,0.35)',
            color: hasFocusRunning ? '#00C2A8' : '#7B61FF',
            boxShadow: hasFocusRunning ? '0 0 14px rgba(0,194,168,0.25)' : '0 0 14px rgba(123,97,255,0.18)',
          }}
        >
          <Timer size={14} />
          {hasFocusRunning ? 'Focus actif' : 'Focus'}
        </button>
      </div>

      {/* XP Bar */}
      <XPBar compact className="mb-5" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Aujourd'hui", value: `${doneTasks.length}/${todayTasks.length}`, sub: 'tâches', icon: <CheckSquare size={16} />, color: '#7B61FF' },
          { label: 'Streak',      value: `${streak}`,        sub: 'jours 🔥',        icon: <Flame size={16} />,      color: '#FFB830' },
          { label: 'Niveau',      value: userStats.level,    sub: `${userStats.xp} XP`, icon: <Zap size={16} />,    color: '#A259FF' },
          { label: 'Progression', value: `${globalPct}%`,   sub: 'tous domaines',    icon: <TrendingUp size={16} />, color: '#00C2A8' },
        ].map((card) => (
          <div key={card.label} className="bg-bg-2 border border-border rounded-xl p-3 md:p-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2" style={{ background: hexToRgba(card.color, 0.15), color: card.color }}>
              {card.icon}
            </div>
            <div className="font-heading font-extrabold text-xl leading-none mb-0.5">{card.value}</div>
            <div className="text-[10px] uppercase tracking-wider text-content-3 font-medium">{card.label}</div>
            <div className="text-[10px] text-content-4">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Top 3 du jour */}
      {top3.length > 0 && (
        <div className="mb-6 bg-bg-2 border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-bold text-sm uppercase tracking-widest text-content-2 flex items-center gap-1.5">
              <Star size={13} className="text-warning" /> Top 3 du jour
            </h2>
            <Link href="/tasks">
              <span className="text-[11px] text-accent hover:underline flex items-center gap-1">
                Toutes <ArrowRight size={11} />
              </span>
            </Link>
          </div>
          <div className="space-y-2">
            {top3.map((task) => {
              const domain = domains.find((d) => d.id === task.domainId)
              const goal = goals.find((g) => g.id === task.goalId)
              return (
                <TaskItem
                  key={task.id}
                  task={task}
                  domain={domain}
                  goalTitle={goal?.title}
                  onToggle={() => toggleTask(task.id)}
                  onDelete={() => deleteTask(task.id)}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        {/* Domains */}
        <div className="bg-bg-2 border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-bold text-sm uppercase tracking-widest text-content-2">Domaines</h2>
            <Link href="/domains"><span className="text-[11px] text-accent hover:underline flex items-center gap-1">Voir <ArrowRight size={11} /></span></Link>
          </div>
          {domains.length === 0 ? (
            <div className="text-center py-6 text-content-3">
              <Globe size={28} className="mx-auto mb-2 opacity-30" />
              <Link href="/domains"><span className="text-xs text-accent hover:underline">Créer un domaine →</span></Link>
            </div>
          ) : (
            <div className="space-y-2">
              {domains.map((domain) => {
                const pct = getDomainProgress(domain.id)
                return (
                  <Link key={domain.id} href={`/goals?domain=${domain.id}`}>
                    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-bg-3 transition-all">
                      <RingProgress value={pct} size={36} strokeWidth={3} color={domain.color}>
                        <span className="text-[8px] font-bold" style={{ color: domain.color }}>{pct}%</span>
                      </RingProgress>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <DomainIcon name={domain.icon} size={13} color={domain.color} />
                          <span className="font-medium text-xs text-content">{domain.name}</span>
                        </div>
                      </div>
                      <ArrowRight size={12} className="text-content-4" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Today tasks */}
        <div className="bg-bg-2 border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-bold text-sm uppercase tracking-widest text-content-2">Tâches du jour</h2>
            <Link href="/tasks"><span className="text-[11px] text-accent hover:underline flex items-center gap-1">Toutes <ArrowRight size={11} /></span></Link>
          </div>
          {todayTasks.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <ProgressBar value={todayTasks.length ? (doneTasks.length / todayTasks.length) * 100 : 0} color="#7B61FF" className="flex-1" />
              <span className="text-xs font-bold text-content-2">{doneTasks.length}/{todayTasks.length}</span>
            </div>
          )}
          {todayTasks.length === 0 ? (
            <div className="text-center py-6 text-content-3">
              <CheckSquare size={28} className="mx-auto mb-2 opacity-30" />
              <Link href="/tasks"><span className="text-xs text-accent hover:underline">Ajouter une tâche →</span></Link>
            </div>
          ) : (
            <div className="space-y-1.5">
              {todayTasks.slice(0, 4).map((task) => {
                const domain = domains.find((d) => d.id === task.domainId)
                const goal = goals.find((g) => g.id === task.goalId)
                return (
                  <TaskItem key={task.id} task={task} domain={domain} goalTitle={goal?.title}
                    onToggle={() => toggleTask(task.id)} onDelete={() => deleteTask(task.id)} />
                )
              })}
              {todayTasks.length > 4 && (
                <Link href="/tasks" className="text-xs text-center text-accent hover:underline py-1 block">
                  +{todayTasks.length - 4} autres →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Challenges + Badges */}
      <div className="grid md:grid-cols-2 gap-5">
        <ChallengeDashboardWidget />
        <BadgesWidget limit={5} />
      </div>

      {/* Focus Modal */}
      {showFocus && <FocusMode onClose={() => setShowFocus(false)} />}
    </div>
  )
}
