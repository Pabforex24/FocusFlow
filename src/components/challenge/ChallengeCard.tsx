'use client'

import { Challenge, ActiveChallenge } from '@/types'
import { RingProgress } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { DomainIcon } from '@/components/domain/DomainIcon'
import { hexToRgba } from '@/lib/utils'
import { Play, Square, Calendar, Layers } from 'lucide-react'
import { differenceInDays, format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ChallengeCardProps {
  challenge: Challenge
  activeChallenge?: ActiveChallenge
  progress?: number
  onStart: () => void
  onStop: () => void
}

export function ChallengeCard({
  challenge,
  activeChallenge,
  progress = 0,
  onStart,
  onStop,
}: ChallengeCardProps) {
  const isActive = !!activeChallenge?.isActive

  const daysLeft = activeChallenge
    ? Math.max(0, differenceInDays(new Date(activeChallenge.endDate), new Date()))
    : null

  const endFormatted = activeChallenge
    ? format(new Date(activeChallenge.endDate), 'd MMM yyyy', { locale: fr })
    : null

  return (
    <div
      className="relative bg-bg-2 border border-border rounded-2xl overflow-hidden transition-all duration-200 hover:border-border-2 shadow-card"
      style={isActive ? { borderColor: challenge.color + '60', boxShadow: `0 0 0 1px ${challenge.color}30, 0 4px 32px rgba(0,0,0,0.5)` } : { boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
    >
      {/* Color accent bar */}
      <div className="h-1 w-full" style={{ background: challenge.color }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: hexToRgba(challenge.color, 0.15) }}
            >
              <DomainIcon name={challenge.icon} size={20} color={challenge.color} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-content leading-tight">
                {challenge.title}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Calendar size={11} className="text-content-3" />
                <span className="text-[11px] text-content-3">{challenge.durationDays} jours</span>
              </div>
            </div>
          </div>

          {isActive ? (
            <Badge color={challenge.color} className="text-[10px] px-2 py-0.5 whitespace-nowrap">
              🔥 En cours
            </Badge>
          ) : (
            <Badge className="text-[10px] px-2 py-0.5 bg-bg-3 text-content-3 border border-border">
              Disponible
            </Badge>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-content-3 leading-relaxed mb-4 line-clamp-2">
          {challenge.description}
        </p>

        {/* Blueprints */}
        <div className="flex items-center gap-1.5 mb-4">
          <Layers size={11} className="text-content-3" />
          <span className="text-[10px] text-content-3 uppercase tracking-wide font-medium">
            {challenge.blueprints.length} tâche{challenge.blueprints.length > 1 ? 's' : ''}/jour
          </span>
          <div className="flex gap-1 ml-1">
            {challenge.blueprints.slice(0, 3).map((bp) => (
              <span
                key={bp.id}
                className="text-[10px] bg-bg-3 text-content-2 px-1.5 py-0.5 rounded-md"
              >
                {bp.duration}
              </span>
            ))}
          </div>
        </div>

        {/* Progress (active only) */}
        {isActive && (
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: hexToRgba(challenge.color, 0.08) }}>
            <RingProgress value={progress} size={44} strokeWidth={3} color={challenge.color}>
              <span className="text-[9px] font-bold" style={{ color: challenge.color }}>
                {progress}%
              </span>
            </RingProgress>
            <div className="flex-1">
              <div className="text-xs font-semibold text-content mb-0.5">
                {daysLeft === 0 ? "Dernier jour !" : `${daysLeft} jours restants`}
              </div>
              <div className="text-[10px] text-content-3">Fin le {endFormatted}</div>
            </div>
          </div>
        )}

        {/* CTA */}
        {isActive ? (
          <button
            onClick={onStop}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 border"
            style={{
              background: 'rgba(255,107,107,0.06)',
              borderColor: 'rgba(255,107,107,0.25)',
              color: '#FF6B6B',
            }}
          >
            <Square size={11} /> Arrêter le challenge
          </button>
        ) : (
          <button
            onClick={onStart}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border"
            style={{
              background: hexToRgba(challenge.color, 0.12),
              borderColor: challenge.color + '50',
              color: challenge.color,
              boxShadow: `0 0 14px ${challenge.color}25`,
            }}
          >
            <Play size={11} fill="currentColor" /> Démarrer
          </button>
        )}
      </div>
    </div>
  )
}
