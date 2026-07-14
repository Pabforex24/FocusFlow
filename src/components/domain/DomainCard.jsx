'use client'

import { Pencil, Trash2, Target } from 'lucide-react'
import { hexToRgba } from '@/lib/utils'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { DomainIcon } from './DomainIcon'


export function DomainCard({ domain, progress, goalCount, onClick, onEdit, onDelete }) {
  const c = domain.color
  return (
    <div
      className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
      style={{
        background: `linear-gradient(145deg, rgba(14,18,36,0.92) 0%, rgba(9,13,26,0.95) 100%)`,
        border: `1px solid ${hexToRgba(c, 0.25)}`,
        boxShadow: `0 4px 32px rgba(0,0,0,0.55), inset 0 0 40px ${hexToRgba(c, 0.03)}`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget ).style.boxShadow =
          `0 8px 40px rgba(0,0,0,0.60), 0 0 24px ${hexToRgba(c, 0.22)}, inset 0 0 40px ${hexToRgba(c, 0.05)}`
        ;(e.currentTarget ).style.borderColor = hexToRgba(c, 0.45)
      }}
      onMouseLeave={(e) => {
        (e.currentTarget ).style.boxShadow =
          `0 4px 32px rgba(0,0,0,0.55), inset 0 0 40px ${hexToRgba(c, 0.03)}`
        ;(e.currentTarget ).style.borderColor = hexToRgba(c, 0.25)
      }}
      onClick={onClick}
    >
      {/* Top accent line */}
      <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${c}, transparent)`, opacity: 0.5 }} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${hexToRgba(c, 0.18)} 0%, ${hexToRgba(c, 0.07)} 100%)`,
                border: `1px solid ${hexToRgba(c, 0.25)}`,
                boxShadow: `0 0 16px ${hexToRgba(c, 0.15)}`,
              }}
            >
              <DomainIcon name={domain.icon} size={22} color={c} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-content tracking-tight">{domain.name}</h3>
              <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: '#3D4F6E' }}>
                <Target size={10} strokeWidth={1.75} />
                <span>{goalCount} objectif{goalCount !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit?.() }}>
              <Pencil size={12} />
            </Button>
            <Button variant="danger" size="icon" onClick={(e) => { e.stopPropagation(); onDelete?.() }}>
              <Trash2 size={12} />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: '#3D4F6E' }}>
            Progression
          </span>
          <span className="font-heading font-extrabold text-2xl leading-none" style={{ color: c }}>
            {progress}%
          </span>
        </div>
        <ProgressBar value={progress} color={c} height="md" />
        <p className="text-[10px] mt-3" style={{ color: '#1E2A40' }}>Cliquer pour voir les objectifs →</p>
      </div>
    </div>
  )
}
