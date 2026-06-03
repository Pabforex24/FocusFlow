import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-8', className)}>
      <div>
        <h1 className="font-heading font-extrabold text-[26px] sm:text-[30px] tracking-tight text-content leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-content-3 text-[13px] mt-1.5 font-normal">{subtitle}</p>
        )}
        {/* Amber underline */}
        <div
          className="mt-3 h-[2px] w-10 rounded-full"
          style={{ background: 'linear-gradient(90deg, #d4a843, #f0c96e)' }}
        />
      </div>
      {action && <div className="flex-shrink-0 mt-1">{action}</div>}
    </div>
  )
}
