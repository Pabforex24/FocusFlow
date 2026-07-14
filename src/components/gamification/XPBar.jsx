'use client'

import { useStore } from '@/store'
import { cn } from '@/lib/utils'
import { Zap } from 'lucide-react'


export function XPBar({ compact = false, className }) {
  const { userStats } = useStore()
  const { xp, level, xpToNextLevel } = userStats
  const xpNeeded = level * 100 + 50
  const xpCurrent = xpNeeded - xpToNextLevel
  const pct = Math.min(100, Math.round((xpCurrent / xpNeeded) * 100))

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex items-center gap-1 text-xs font-bold" style={{ color: '#00E5B0' }}>
          <Zap size={12} fill="currentColor" strokeWidth={0} />
          <span>Nv.{level}</span>
        </div>
        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #00E5B0, #3DD8FA)', boxShadow: '0 0 8px rgba(0,229,176,0.5)' }}
          />
        </div>
        <span className="text-[10px]" style={{ color: '#3D4F6E' }}>{xpToNextLevel}xp</span>
      </div>
    )
  }

  return (
    <div
      className={cn('rounded-2xl p-4', className)}
      style={{
        background: 'linear-gradient(135deg, rgba(0,229,176,0.06) 0%, rgba(9,13,26,0.90) 100%)',
        border: '1px solid rgba(0,229,176,0.14)',
        boxShadow: '0 0 24px rgba(0,229,176,0.06)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold"
            style={{ background: 'rgba(0,229,176,0.15)', color: '#00E5B0', border: '1px solid rgba(0,229,176,0.25)', boxShadow: '0 0 12px rgba(0,229,176,0.15)' }}
          >
            {level}
          </div>
          <div>
            <p className="text-xs font-bold text-content tracking-tight">Niveau {level}</p>
            <p className="text-[10px]" style={{ color: '#3D4F6E' }}>{xp} XP total</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px]" style={{ color: '#3D4F6E' }}>Prochain niveau</p>
          <p className="text-[11px] font-bold" style={{ color: '#00E5B0' }}>{xpToNextLevel} XP restants</p>
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #00E5B0, #3DD8FA)', boxShadow: '0 0 10px rgba(0,229,176,0.5)' }}
        />
      </div>
      <p className="text-[10px] mt-1.5 text-right" style={{ color: '#1E2A40' }}>{pct}% vers le niveau {level + 1}</p>
    </div>
  )
}
