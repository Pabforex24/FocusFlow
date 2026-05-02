'use client'

import { Challenge, ActiveChallenge } from '@/types'
import { DomainIcon } from '@/components/domain/DomainIcon'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { hexToRgba } from '@/lib/utils'
import { Zap, StopCircle, Calendar, CheckCircle2 } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ChallengeCardProps {
  challenge: Challenge
  activeChallenge?: ActiveChallenge
  progress: number
  onStart: () => void
  onStop: () => void
}

export function ChallengeCard({
  challenge,
  activeChallenge,
  progress,
  onStart,
  onStop,
}: ChallengeCardProps) {
  const isActive    = !!activeChallenge?.isActive
  const isCompleted = !isActive && !!activeChallenge && progress === 100

  const daysLeft = activeChallenge?.isActive
    ? Math.max(0, differenceInDays(new Date(activeChallenge.endDate), new Date()))
    : null

  const endLabel = activeChallenge
    ? format(new Date(activeChallenge.endDate), 'd MMM yyyy', { locale: fr })
    : null

  return (
    <div
      className="relative rounded-2xl border p-4 flex flex-col gap-3 transition-all duration-200 overflow-hidden"
      style={{
        background: hexToRgba(challenge.color, 0.06),
        borderColor: challenge.color + (isActive ? '50' : '25'),
        boxShadow: isActive ? `0 0 20px ${hexToRgba(challenge.color, 0.15)}` : 'none',
      }}
    >
      {/* Glow strip top */}
      {isActive && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
          style={{ background: `linear-gradient(90deg, transparent, ${challenge.color}, transparent)` }}
        />
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: hexToRgba(challenge.color, 0.2) }}
        >
          <DomainIcon name={challenge.icon} size={20} color={challenge.color} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading font-bold text-sm text-content leading-tight truncate">
              {challenge.title}
            </h3>
            {isActive && (
              <span
                className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{ background: hexToRgba(challenge.color, 0.2), color: challenge.color }}
              >
                Actif
              </span>
            )}
            {isCompleted && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 flex-shrink-0">
                Terminé
              </span>
            )}
          </div>
          <p className="text-[11px] text-content-3 mt-0.5 line-clamp-2">{challenge.description}</p>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 text-[11px] text-content-3 flex-wrap">
        <span className="flex items-center gap-1">
          <Calendar size={11} />
          {daysLeft !== null
            ? daysLeft === 0
              ? "Dernier jour !"
              : `${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}`
            : `${challenge.durationDays} jours`}
        </span>
        {endLabel && (
          <span className="text-content-4">→ {endLabel}</span>
        )}
        <span className="flex items-center gap-1 ml-auto">
          <CheckCircle2 size={11} />
          {challenge.blueprints.length} tâche{challenge.blueprints.length > 1 ? 's' : ''}/jour
        </span>
      </div>

      {/* Progress (only when started) */}
      {activeChallenge && (
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-content-3">Progression globale</span>
            <span
              className="text-xs font-extrabold font-heading"
              style={{ color: challenge.color }}
            >
              {progress}%
            </span>
          </div>
          <ProgressBar value={progress} color={challenge.color} height="sm" />
        </div>
      )}

      {/* Blueprints preview */}
      {!activeChallenge && (
        <div className="space-y-1">
          {challenge.blueprints.slice(0, 3).map((bp) => (
            <div
              key={bp.id}
              className="flex items-center gap-2 text-[11px] text-content-3 bg-bg-3/60 rounded-lg px-2.5 py-1.5"
            >
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: challenge.color }}
              />
              <span className="truncate flex-1">{bp.title}</span>
              {bp.duration && (
                <span className="text-content-4 flex-shrink-0">{bp.duration}</span>
              )}
            </div>
          ))}
          {challenge.blueprints.length > 3 && (
            <p className="text-[10px] text-content-4 pl-2">
              +{challenge.blueprints.length - 3} autre(s)…
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-1">
        {isActive ? (
          <button
            onClick={onStop}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-danger/30 text-danger hover:bg-danger/10 transition-all"
          >
            <StopCircle size={12} /> Arrêter
          </button>
        ) : (
          <button
            onClick={onStart}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200"
            style={{
              background: hexToRgba(challenge.color, 0.14),
              borderColor: challenge.color + '55',
              color: challenge.color,
              boxShadow: `0 0 14px ${hexToRgba(challenge.color, 0.2)}`,
            }}
          >
            <Zap size={12} fill="currentColor" />
            {isCompleted ? 'Relancer' : 'Lancer'}
          </button>
        )}
      </div>
    </div>
  )
}
