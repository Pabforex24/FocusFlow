import { cn } from '@/lib/utils'
import { hexToRgba } from '@/lib/utils'

interface BadgeProps {
  color?: string
  children: React.ReactNode
  className?: string
}

export function Badge({ color, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide',
        className
      )}
      style={
        color
          ? {
              background: hexToRgba(color, 0.12),
              color,
              border: `1px solid ${hexToRgba(color, 0.25)}`,
            }
          : {
              background: 'rgba(255,255,255,0.06)',
              color: '#7c7c9a',
              border: '1px solid rgba(255,255,255,0.08)',
            }
      }
    >
      {children}
    </span>
  )
}

interface ChipProps {
  active?: boolean
  color?: string
  onClick?: () => void
  children: React.ReactNode
  className?: string
}

export function Chip({ active, color, onClick, children, className }: ChipProps) {
  const activeColor = color || '#d4a843'

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold',
        'border transition-all duration-200',
        !active && 'hover:border-white/[0.12] hover:text-content',
        className
      )}
      style={
        active
          ? {
              background: hexToRgba(activeColor, 0.14),
              color: activeColor,
              borderColor: hexToRgba(activeColor, 0.3),
              boxShadow: `0 0 12px ${hexToRgba(activeColor, 0.1)}`,
            }
          : {
              background: 'transparent',
              color: '#7c7c9a',
              borderColor: 'rgba(255,255,255,0.07)',
            }
      }
    >
      {children}
    </button>
  )
}
