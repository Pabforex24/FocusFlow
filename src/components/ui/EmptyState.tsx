import { cn } from '@/lib/utils'
import { Button } from './Button'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-16 px-4', className)}>
      <div className="text-content-4 mb-4 opacity-40">{icon}</div>
      <h3 className="font-heading font-bold text-lg text-content-2 mb-2">{title}</h3>
      <p className="text-sm text-content-3 max-w-xs mb-6">{description}</p>
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
