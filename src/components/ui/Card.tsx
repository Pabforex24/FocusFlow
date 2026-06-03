import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  accent?: string
}

export function Card({ className, hover = false, accent, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'relative bg-bg-2 border border-border rounded-xl overflow-hidden',
        hover && 'transition-all duration-200 hover:border-border-2 hover:shadow-card cursor-pointer',
        className
      )}
      {...props}
    >
      {/* Accent left bar — rounded-l-xl to match card shape */}
      {accent && (
        <div
          className="absolute top-0 left-0 bottom-0 w-[4px] rounded-l-xl"
          style={{ background: accent }}
        />
      )}
      {children}
    </div>
  )
}
