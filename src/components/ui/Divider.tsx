import { cn } from '@/lib/utils'

interface DividerProps {
  label?: string
  className?: string
}

export function Divider({ label, className }: DividerProps) {
  if (!label) {
    return <div className={cn('border-t border-border my-4', className)} />
  }
  return (
    <div className={cn('flex items-center gap-3 my-4', className)}>
      <div className="flex-1 border-t border-border" />
      <span className="text-[10px] text-content-3 uppercase tracking-wider font-medium">{label}</span>
      <div className="flex-1 border-t border-border" />
    </div>
  )
}
