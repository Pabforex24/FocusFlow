'use client'

import { useStore } from '@/store'
import { cn } from '@/lib/utils'
import { Zap } from 'lucide-react'

interface XPBarProps {
  compact?: boolean
  className?: string
}

export function XPBar({ compact = false, className }: XPBarProps) {
  const { userStats } = useStore()
  const { xp, level, xpToNextLevel } = userStats
  const xpInCurrentLevel = xp - Array.from({ length: level - 1 }, (_, i) => (i + 1) * 100 + 50).reduce((a, b) => a + b, 0)
  const xpNeeded = (level * 100 + 50)
  const pct = Math.min(100, Math.round((xpInCurrentLevel / xpNeeded) * 100))

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex items-center gap-1 text-xs font-bold" style={{ color: '#7B61FF' }}>
          <Zap size={12} fill="currentColor" />
          <span>Nv.{level}</span>
        </div>
        <div className="flex-1 h-1 bg-bg-4 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #7B61FF, #A259FF)' }}
          />
        </div>
        <span className="text-[10px] text-content-3">{xpToNextLevel}xp</span>
      </div>
    )
  }

  return (
    <div className={cn('bg-bg-2 border border-border rounded-xl p-4', className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-extrabold"
            style={{ background: 'rgba(123,97,255,0.2)', color: '#7B61FF' }}
          >
            {level}
          </div>
          <div>
            <p className="text-xs font-bold text-content">Niveau {level}</p>
            <p className="text-[10px] text-content-3">{xp} XP total</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-content-3">Prochain niveau</p>
          <p className="text-[10px] font-bold text-accent">{xpToNextLevel} XP restants</p>
        </div>
      </div>
      <div className="h-2 bg-bg-4 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #7B61FF, #A259FF)',
            boxShadow: '0 0 8px rgba(123,97,255,0.5)',
          }}
        />
      </div>
      <p className="text-[10px] text-content-4 mt-1 text-right">{pct}% vers le niveau {level + 1}</p>
    </div>
  )
}
