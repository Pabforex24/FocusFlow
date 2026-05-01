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
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
        className
      )}
      style={
        color
          ? {
              background: hexToRgba(color, 0.15),
              color,
              border: `1px solid ${hexToRgba(color, 0.3)}`,
            }
          : {}
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
}

export function Chip({ active, color, onClick, children }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150',
        active
          ? 'text-white'
          : 'bg-bg-3 border-border text-content-2 hover:border-border-2 hover:text-content'
      )}
      style={
        active && color
          ? {
              background: hexToRgba(color, 0.2),
              color,
              borderColor: hexToRgba(color, 0.4),
            }
          : active
          ? { background: '#6d5aec', borderColor: '#6d5aec' }
          : {}
      }
    >
      {children}
    </button>
  )
}
