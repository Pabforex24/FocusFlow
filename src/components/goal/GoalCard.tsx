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

export function GoalCard({
  goal, domain, progress, taskCount, doneCount, onEdit, onDelete,
}: GoalCardProps) {
  const [expanded, setExpanded] = useState(false)
  const color = domain?.color || '#7B61FF'

  const borderColor = hexToRgba(color, 0.45)
  const innerGlow   = `inset 0 0 28px ${hexToRgba(color, 0.03)}`
  const glowHover   = `0 0 18px ${hexToRgba(color, 0.22)}, 0 0 1px ${hexToRgba(color, 0.5)}`

  return (
    <div
      className="group relative bg-bg-2 rounded-2xl overflow-hidden transition-all duration-300 mb-3"
      style={{ border: `1px solid ${borderColor}`, boxShadow: `0 0 0px transparent, ${innerGlow}` }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `${glowHover}, ${innerGlow}` }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0px transparent, ${innerGlow}` }}
    >
      <div
        className="flex items-start gap-3 px-5 py-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <button className="mt-1 text-content-3 hover:text-content transition-colors flex-shrink-0">
          {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <h3 className="font-heading font-bold text-[15px] text-content leading-snug">
                {goal.title}
              </h3>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {domain && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                    style={{
                      background: hexToRgba(domain.color, 0.12),
                      color: domain.color,
                      border: `1px solid ${hexToRgba(domain.color, 0.25)}`,
                    }}
                  >
                    <DomainIcon name={domain.icon} size={11} color={domain.color} />
                    {domain.name}
                  </span>
                )}
                {goal.unit && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                    style={{ background: hexToRgba(color, 0.08), color: '#8e8eaa', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    {goal.unit}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-[11px] text-content-3">
                  <CheckSquare size={10} />
                  {doneCount}/{taskCount} tâches
                </span>
              </div>
            </div>

            <div className="flex-shrink-0 flex items-center gap-2">
              <span className="font-heading font-extrabold text-2xl leading-none" style={{ color }}>
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

          <ProgressBar value={progress} color={color} height="md" />
        </div>
      </div>

      {expanded && goal.description && (
        <div className="px-5 pb-4 ml-6">
          <p
            className="text-sm text-content-3 leading-relaxed bg-bg-3 rounded-xl px-4 py-3"
            style={{ border: `1px solid ${hexToRgba(color, 0.15)}` }}
          >
            {goal.description}
          </p>
        </div>
      )}
    </div>
  )
}
