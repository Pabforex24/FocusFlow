'use client'

import { Pencil, Trash2, Target } from 'lucide-react'
import { Domain } from '@/types'
import { hexToRgba } from '@/lib/utils'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { DomainIcon } from './DomainIcon'

interface DomainCardProps {
  domain: Domain
  progress: number
  goalCount: number
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function DomainCard({
  domain, progress, goalCount, onClick, onEdit, onDelete,
}: DomainCardProps) {
  const borderColor = hexToRgba(domain.color, 0.5)
  const glowRest    = `0 0 0px transparent`
  const glowHover   = `0 0 20px ${hexToRgba(domain.color, 0.25)}, 0 0 1px ${hexToRgba(domain.color, 0.6)}`
  const innerGlow   = `inset 0 0 28px ${hexToRgba(domain.color, 0.04)}`

  return (
    <div
      className="group relative bg-bg-2 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
      style={{ border: `1px solid ${borderColor}`, boxShadow: `${glowRest}, ${innerGlow}` }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `${glowHover}, ${innerGlow}` }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `${glowRest}, ${innerGlow}` }}
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: hexToRgba(domain.color, 0.12) }}
            >
              <DomainIcon name={domain.icon} size={22} color={domain.color} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-content">{domain.name}</h3>
              <div className="flex items-center gap-1 text-xs text-content-3 mt-0.5">
                <Target size={11} />
                {goalCount} objectif{goalCount !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit?.() }}>
              <Pencil size={13} />
            </Button>
            <Button variant="danger" size="icon" onClick={(e) => { e.stopPropagation(); onDelete?.() }}>
              <Trash2 size={13} />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-content-3">Progression</span>
          <span className="font-heading font-extrabold text-lg leading-none" style={{ color: domain.color }}>
            {progress}%
          </span>
        </div>
        <ProgressBar value={progress} color={domain.color} height="md" />
        <p className="text-[11px] text-content-4 mt-3">Cliquer pour voir les objectifs →</p>
      </div>
    </div>
  )
}
