'use client'

import Link from 'next/link'
import { useStore, CHALLENGE_CATALOGUE } from '@/store'
import { RingProgress } from '@/components/ui/ProgressBar'
import { DomainIcon } from '@/components/domain/DomainIcon'
import { hexToRgba } from '@/lib/utils'
import { Trophy, ArrowRight, Zap, CheckCircle2 } from 'lucide-react'
import { differenceInDays } from 'date-fns'

export function ChallengeDashboardWidget() {
  const { activeChallenges, getChallengeProgress, getTodayChallengeTaskCount, customChallenges } = useStore()
  const allChallenges = [...CHALLENGE_CATALOGUE, ...(customChallenges || [])]
  const running = activeChallenges.filter((ac) => ac.isActive)

  if (!running.length) {
    return (
      <div className="bg-bg-2 border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-bold text-sm uppercase tracking-widest text-content-2">
            Challenges
          </h2>
          <Link href="/challenges">
            <span className="text-[11px] text-accent hover:underline flex items-center gap-1">
              Explorer <ArrowRight size={11} />
            </span>
          </Link>
        </div>
        <div className="text-center py-4">
          <Trophy size={28} className="mx-auto mb-2 text-content-4" />
          <p className="text-xs text-content-3">Aucun challenge actif</p>
          <Link href="/challenges">
            <span className="text-xs text-accent hover:underline">Lancer un challenge →</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-bg-2 border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-bold text-sm uppercase tracking-widest text-content-2 flex items-center gap-1.5">
          <Zap size={13} className="text-yellow-400" /> Challenges actifs
        </h2>
        <Link href="/challenges">
          <span className="text-[11px] text-accent hover:underline flex items-center gap-1">
            Voir tout <ArrowRight size={11} />
          </span>
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {running.map((ac) => {
          const challenge = allChallenges.find((c) => c.id === ac.challengeId)
          if (!challenge) return null

          const progress = getChallengeProgress(ac.id, ac.challengeId)
          const { total, done } = getTodayChallengeTaskCount(ac.id)
          const daysLeft = Math.max(0, differenceInDays(new Date(ac.endDate), new Date()))
          const todayPct = total > 0 ? Math.round((done / total) * 100) : 0

          return (
            <div
              key={ac.id}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: hexToRgba(challenge.color, 0.08), border: `1px solid ${challenge.color}30` }}
            >
              {/* Ring global */}
              <RingProgress value={progress} size={48} strokeWidth={3.5} color={challenge.color}>
                <span className="text-[9px] font-bold" style={{ color: challenge.color }}>
                  {progress}%
                </span>
              </RingProgress>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <DomainIcon name={challenge.icon} size={12} color={challenge.color} />
                  <span className="text-xs font-semibold text-content truncate">{challenge.title}</span>
                </div>

                {/* Today mini-bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-bg-3 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${todayPct}%`, background: challenge.color }}
                    />
                  </div>
                  <span className="text-[10px] text-content-3 whitespace-nowrap">
                    {done}/{total} auj.
                  </span>
                </div>

                <div className="text-[10px] text-content-3 mt-0.5">
                  {daysLeft === 0 ? '🏁 Dernier jour !' : `⏳ ${daysLeft}j restants`}
                </div>
              </div>

              {done === total && total > 0 && (
                <CheckCircle2 size={16} style={{ color: challenge.color }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
