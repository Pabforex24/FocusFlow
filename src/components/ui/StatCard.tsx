import { cn, hexToRgba } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  color?: string
  className?: string
}

export function StatCard({ label, value, sub, icon, color = '#6d5aec', className }: StatCardProps) {
  return (
    <div className={cn('bg-bg-2 border border-border rounded-xl p-4', className)}>
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
        style={{ background: hexToRgba(color, 0.15), color }}
      >
        {icon}
      </div>
      <div className="font-heading font-extrabold text-2xl tracking-tight leading-none mb-1">
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-content-3 font-medium">{label}</div>
      {sub && <div className="text-xs text-content-3 mt-0.5">{sub}</div>}
    </div>
  )
}
