'use client'

import Link from 'next/link'
import { Trophy, Zap, ArrowRight, CheckCircle2, Circle } from 'lucide-react'
import { useStore, CHALLENGE_CATALOGUE } from '@/store'
import { hexToRgba } from '@/lib/utils'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { DomainIcon } from '@/components/domain/DomainIcon'

export function ChallengeDashboardWidget() {
  const {
    activeChallenges,
    customChallenges,
    getChallengeProgress,
    getTodayChallengeTaskCount,
    toggleTask,
    tasks,
  } = useStore()

  const activeOnes = activeChallenges.filter((ac) => ac.isActive)

  if (activeOnes.length === 0) {
    return (
      <div className="bg-bg-2 border border-border-2 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-bold text-sm flex items-center gap-2">
            <Trophy size={15} className="text-warning" /> Challenges
          </h2>
          <Link
            href="/challenges"
            className="text-xs text-content-3 hover:text-accent flex items-center gap-1 transition-colors"
          >
            Voir tout <ArrowRight size={11} />
          </Link>
        </div>
        <div className="text-center py-6 text-content-3">
          <Trophy size={32} className="mx-auto mb-2 opacity-20" />
          <p className="text-xs">Aucun challenge actif</p>
          <Link
            href="/challenges"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all"
            style={{
              background: 'rgba(123,97,255,0.1)',
              borderColor: 'rgba(123,97,255,0.3)',
              color: '#7B61FF',
            }}
          >
            <Zap size={11} /> Lancer un challenge
          </Link>
        </div>
      </div>
    )
  }

  const allChallenges = [...CHALLENGE_CATALOGUE, ...(customChallenges || [])]

  return (
    <div className="bg-bg-2 border border-border-2 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-bold text-sm flex items-center gap-2">
          <Trophy size={15} className="text-warning" /> Challenges actifs
        </h2>
        <Link
          href="/challenges"
          className="text-xs text-content-3 hover:text-accent flex items-center gap-1 transition-colors"
        >
          Gérer <ArrowRight size={11} />
        </Link>
      </div>

      <div className="space-y-4">
        {activeOnes.map((ac) => {
          const challenge = allChallenges.find((c) => c.id === ac.challengeId)
          if (!challenge) return null

          const progress = getChallengeProgress(ac.id)
          const { total, done } = getTodayChallengeTaskCount(ac.id)

          const todayStr = new Date().toDateString()
          const todayTasks = tasks.filter(
            (t) =>
              t.challengeActiveId === ac.id &&
              new Date(t.scheduledAt).toDateString() === todayStr
          )

          const startDate = new Date(ac.startDate)
          const endDate   = new Date(ac.endDate)
          const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000))
          const daysPassed = Math.min(
            totalDays,
            Math.round((Date.now() - startDate.getTime()) / 86400000) + 1
          )

          return (
            <div
              key={ac.id}
              className="rounded-xl border p-4 transition-all"
              style={{
                background: hexToRgba(challenge.color, 0.06),
                borderColor: challenge.color + '30',
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: hexToRgba(challenge.color, 0.2) }}
                >
                  <DomainIcon name={challenge.icon} size={16} color={challenge.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-sm text-content truncate">
                    {challenge.title}
                  </p>
                  <p className="text-[10px] text-content-3">
                    Jour {daysPassed}/{totalDays} · {done}/{total} tâches aujourd'hui
                  </p>
                </div>
                <span
                  className="text-sm font-extrabold font-heading flex-shrink-0"
                  style={{ color: challenge.color }}
                >
                  {progress}%
                </span>
              </div>

              {/* Progress bar */}
              <ProgressBar value={progress} color={challenge.color} height="sm" className="mb-3" />

              {/* Today's tasks */}
              {todayTasks.length > 0 && (
                <div className="space-y-1.5">
                  {todayTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className="w-full flex items-center gap-2 text-left group"
                    >
                      {task.done ? (
                        <CheckCircle2
                          size={14}
                          className="flex-shrink-0 transition-colors"
                          style={{ color: challenge.color }}
                        />
                      ) : (
                        <Circle
                          size={14}
                          className="flex-shrink-0 text-content-4 group-hover:text-content-2 transition-colors"
                        />
                      )}
                      <span
                        className={`text-xs transition-colors truncate ${
                          task.done ? 'line-through text-content-3' : 'text-content-2 group-hover:text-content'
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.duration && (
                        <span className="ml-auto text-[10px] text-content-4 flex-shrink-0">
                          {task.duration}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {todayTasks.length === 0 && (
                <p className="text-[11px] text-content-4 italic">
                  Aucune tâche planifiée aujourd'hui
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
