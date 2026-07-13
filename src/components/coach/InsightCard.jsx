import { cn } from '@/lib/utils'


export function InsightCard({ icon, title, children, className }: InsightCardProps) {
  return (
    <div className={cn('bg-bg-2 border border-border rounded-xl p-4 mb-3', className)}>
      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-2xl">{icon}</span>
        <h3 className="font-heading font-bold text-base">{title}</h3>
      </div>
      <div className="text-sm text-content-2 leading-relaxed">{children}</div>
    </div>
  )
}
