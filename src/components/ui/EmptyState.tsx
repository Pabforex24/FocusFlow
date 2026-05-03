import { cn } from '@/lib/utils'
import { Button } from './Button'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: { label: string; onClick: () => void }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl', className)}
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* Icon glow */}
      <div className="relative mb-5">
        <div
          className="absolute inset-0 rounded-full"
          style={{ background: 'rgba(212,168,67,0.1)', filter: 'blur(20px)', transform: 'scale(1.5)' }}
        />
        <div
          className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#45455e' }}
        >
          {icon}
        </div>
      </div>

      <h3 className="font-heading font-bold text-[17px] text-content-2 mb-2">{title}</h3>
      <p className="text-[13px] text-content-3 max-w-[260px] leading-relaxed mb-6">{description}</p>

      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
