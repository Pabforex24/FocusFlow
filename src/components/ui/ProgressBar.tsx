'use client'

import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  color?: string
  height?: 'sm' | 'md' | 'lg'
  className?: string
  animated?: boolean
  glow?: boolean
}

export function ProgressBar({
  value, color = '#00E5B0', height = 'sm', className, animated = true, glow = true,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div
      className={cn(
        'w-full rounded-full overflow-hidden',
        height === 'sm' && 'h-1.5',
        height === 'md' && 'h-2',
        height === 'lg' && 'h-2.5',
        className
      )}
      style={{ background: 'rgba(255,255,255,0.05)' }}
    >
      <div
        className={cn('h-full rounded-full', animated && 'transition-all duration-700 ease-out')}
        style={{
          width: `${clamped}%`,
          background: color,
          boxShadow: glow && clamped > 5 ? `0 0 8px ${color}60` : 'none',
        }}
      />
    </div>
  )
}

interface RingProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  color?: string
  className?: string
  children?: React.ReactNode
  glow?: boolean
}

export function RingProgress({
  value, size = 56, strokeWidth = 4, color = '#00E5B0', className, children, glow = true,
}: RingProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const r = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-700 ease-out"
          style={{ filter: glow && clamped > 5 ? `drop-shadow(0 0 4px ${color}90)` : 'none' }}
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  )
}
