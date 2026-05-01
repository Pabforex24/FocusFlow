import { cn } from '@/lib/utils'

interface SectionTitleProps {
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function SectionTitle({ children, action, className }: SectionTitleProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <h2 className="font-heading font-bold text-xs uppercase tracking-widest text-content-2">
        {children}
      </h2>
      {action && <div>{action}</div>}
    </div>
  )
}
