import { Zap } from 'lucide-react'
import { cn } from '../../lib/cn.js'

export default function Logo({ showText = true, className }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-linear-to-br from-brand-500 to-brand-700 text-white shadow-sm">
        <Zap className="size-5" aria-hidden />
      </span>
      {showText && <span className="text-lg font-bold tracking-tight text-fg">FocusFlow</span>}
    </div>
  )
}
