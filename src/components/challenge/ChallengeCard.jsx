'use client'

import { DomainIcon } from '@/components/domain/DomainIcon'
import { RingProgress } from '@/components/ui/ProgressBar'
import { hexToRgba } from '@/lib/utils'
import { Zap, StopCircle, Calendar, Layers } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'


export function ChallengeCard({ challenge, activeChallenge, progress, onStart, onStop }) {
  const isActive    = !!activeChallenge?.isActive
  const isCompleted = !isActive && !!activeChallenge && progress === 100

  const daysLeft = activeChallenge?.isActive
    ? Math.max(0, differenceInDays(new Date(activeChallenge.endDate), new Date()))
    : null

  const endLabel = activeChallenge
    ? format(new Date(activeChallenge.endDate), 'd MMM yyyy', { locale: fr })
    : null

  const c = challenge.color

  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col gap-0 transition-all duration-300"
      style={{
        background: 'rgba(255,255,255,0.022)',
        border: `1px solid ${isActive ? hexToRgba(c, 0.3) : 'rgba(255,255,255,0.07)'}`,
        boxShadow: isActive ? `0 0 32px ${hexToRgba(c, 0.12)}, 0 4px 24px rgba(0,0,0,0.4)` : '0 2px 12px rgba(0,0,0,0.3)',
      }}
    >
      {/* Top glow line */}
      <div
        className="h-[1px] w-full"
        style={{
          background: isActive
            ? `linear-gradient(90deg, transparent 5%, ${c} 40%, ${c} 60%, transparent 95%)`
            : `linear-gradient(90deg, transparent, ${hexToRgba(c, 0.3)}, transparent)`,
          opacity: isActive ? 0.8 : 0.4,
        }}
      />

      <div className="p-4 flex flex-col gap-3.5">
        {/* Header */}
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: hexToRgba(c, 0.12),
              border: `1px solid ${hexToRgba(c, 0.2)}`,
            }}
          >
            <DomainIcon name={challenge.icon} size={18} color={c} />
          </div>

          {/* Title block */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-heading font-bold text-[14px] text-content tracking-tight leading-snug truncate">
                {challenge.title}
              </h3>
              {isActive && (
                <span
                  className="text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: hexToRgba(c, 0.15), color: c, border: `1px solid ${hexToRgba(c, 0.25)}` }}
                >
                  En cours
                </span>
              )}
              {isCompleted && (
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-400/20 flex-shrink-0">
                  Terminé ✓
                </span>
              )}
            </div>
            <p className="text-[12px] text-content-3 mt-0.5 line-clamp-2 leading-relaxed">
              {challenge.description}
            </p>
          </div>

          {/* Ring progress (si actif) */}
          {isActive && (
            <RingProgress value={progress} size={44} strokeWidth={3} color={c} className="flex-shrink-0">
              <span className="font-heading font-bold text-[10px]" style={{ color: c }}>
                {progress}%
              </span>
            </RingProgress>
          )}
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-3 text-[11px] text-content-3">
          <span className="flex items-center gap-1.5">
            <Calendar size={10} style={{ color: c }} />
            {daysLeft !== null
              ? daysLeft === 0 ? 'Dernier jour !' : `${daysLeft}j restants`
              : `${challenge.durationDays} jours`}
          </span>
          {endLabel && (
            <span className="text-content-4">→ {endLabel}</span>
          )}
          <span className="flex items-center gap-1 ml-auto">
            <Layers size={10} />
            {challenge.blueprints.length} tâche{challenge.blueprints.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Blueprints preview (si non actif) */}
        {!activeChallenge && (
          <div className="space-y-1.5">
            {challenge.blueprints.slice(0, 3).map((bp) => (
              <div
                key={bp.id}
                className="flex items-center gap-2 text-[11px] text-content-3 rounded-lg px-3 py-2"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: c }} />
                <span className="flex-1 truncate">{bp.title}</span>
                {bp.duration && (
                  <span className="text-content-4 font-medium flex-shrink-0">{bp.duration}</span>
                )}
              </div>
            ))}
            {challenge.blueprints.length > 3 && (
              <p className="text-[10px] text-content-4 pl-3">+{challenge.blueprints.length - 3} autre(s)…</p>
            )}
          </div>
        )}

        {/* Action */}
        <div className="flex gap-2">
          {isActive ? (
            <button
              onClick={onStop}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
              style={{
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.2)',
                color: '#f87171',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(248,113,113,0.15)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)' }}
            >
              <StopCircle size={12} /> Arrêter
            </button>
          ) : (
            <button
              onClick={onStart}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200"
              style={{
                background: hexToRgba(c, 0.1),
                border: `1px solid ${hexToRgba(c, 0.25)}`,
                color: c,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = hexToRgba(c, 0.18)
                e.currentTarget.style.boxShadow = `0 0 18px ${hexToRgba(c, 0.2)}`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = hexToRgba(c, 0.1)
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <Zap size={12} fill="currentColor" />
              {isCompleted ? 'Relancer' : 'Lancer le challenge'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
