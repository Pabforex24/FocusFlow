'use client'

import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  color?: string
  height?: 'sm' | 'md' | 'lg'
  className?: string
  animated?: boolean
}

export function ProgressBar({
  value,
  color = '#6d5aec',
  height = 'sm',
  className,
  animated = true,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div
      className={cn(
        'w-full bg-bg-3 rounded-full overflow-hidden',
        height === 'sm' && 'h-1.5',
        height === 'md' && 'h-2',
        height === 'lg' && 'h-3',
        className
      )}
    >
      <div
        className={cn('h-full rounded-full', animated && 'transition-all duration-700 ease-out')}
        style={{ width: `${clamped}%`, background: color }}
      />
    </div>
  )
}

// Ring/circle progress variant
interface RingProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  color?: string
  className?: string
  children?: React.ReactNode
}

export function RingProgress({
  value,
  size = 56,
  strokeWidth = 4,
  color = '#6d5aec',
  className,
  children,
}: RingProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const r = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
}
