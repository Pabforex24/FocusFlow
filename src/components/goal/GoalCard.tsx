'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Pencil, Trash2, CheckSquare } from 'lucide-react'
import { Goal, Domain } from '@/types'
import { hexToRgba } from '@/lib/utils'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { DomainIcon } from '@/components/domain/DomainIcon'

interface GoalCardProps {
  goal: Goal
  domain?: Domain
  progress: number
  taskCount: number
  doneCount: number
  onEdit?: () => void
  onDelete?: () => void
}

export function GoalCard({ goal, domain, progress, taskCount, doneCount, onEdit, onDelete }: GoalCardProps) {
  const [expanded, setExpanded] = useState(false)
  const c = domain?.color || '#00E5B0'

  return (
    <div
      className="group relative rounded-2xl overflow-hidden transition-all duration-300 mb-3"
      style={{
        background: 'linear-gradient(145deg, rgba(14,18,36,0.92) 0%, rgba(9,13,26,0.95) 100%)',
        border: `1px solid ${hexToRgba(c, 0.22)}`,
        boxShadow: `0 4px 28px rgba(0,0,0,0.50), inset 0 0 32px ${hexToRgba(c, 0.03)}`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          `0 6px 36px rgba(0,0,0,0.55), 0 0 20px ${hexToRgba(c, 0.18)}, inset 0 0 32px ${hexToRgba(c, 0.04)}`
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          `0 4px 28px rgba(0,0,0,0.50), inset 0 0 32px ${hexToRgba(c, 0.03)}`
      }}
    >
      {/* Top accent */}
      <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${c}, transparent)`, opacity: 0.4 }} />

      <div className="flex items-start gap-3 px-5 py-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <button className="mt-1 transition-colors flex-shrink-0" style={{ color: '#3D4F6E' }}>
          {expanded ? <ChevronDown size={14} strokeWidth={2} /> : <ChevronRight size={14} strokeWidth={2} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <h3 className="font-heading font-bold text-[15px] text-content leading-snug tracking-tight">
                {goal.title}
              </h3>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {domain && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                    style={{
                      background: hexToRgba(domain.color, 0.10),
                      color: domain.color,
                      border: `1px solid ${hexToRgba(domain.color, 0.22)}`,
                    }}
                  >
                    <DomainIcon name={domain.icon} size={10} color={domain.color} />
                    {domain.name}
                  </span>
                )}
                <span
                  className="inline-flex items-center gap-1 text-[11px]"
                  style={{ color: '#3D4F6E' }}
                >
                  <CheckSquare size={10} strokeWidth={1.75} />
                  {doneCount}/{taskCount} tâches
                </span>
              </div>
            </div>

            <div className="flex-shrink-0 flex items-center gap-2">
              <span className="font-heading font-extrabold text-2xl leading-none" style={{ color: c }}>
                {progress}%
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit?.() }}>
                  <Pencil size={12} />
                </Button>
                <Button variant="danger" size="icon" onClick={(e) => { e.stopPropagation(); onDelete?.() }}>
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>
          </div>

          <ProgressBar value={progress} color={c} height="md" />
        </div>
      </div>

      {expanded && goal.description && (
        <div className="px-5 pb-4 ml-6">
          <p
            className="text-sm leading-relaxed rounded-xl px-4 py-3"
            style={{
              color: '#7A8BAD',
              background: 'rgba(255,255,255,0.025)',
              border: `1px solid ${hexToRgba(c, 0.12)}`,
            }}
          >
            {goal.description}
          </p>
        </div>
      )}
    </div>
  )
}
