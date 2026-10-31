import { Zap } from 'lucide-react'
import { cn } from '../../lib/cn.js'

export default function Logo({ showText = true, inverted = false, className }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-linear-to-br from-brand-300 to-brand-500 text-brand-950 shadow-[0_0_14px_rgb(var(--accent-rgb)/0.4)]">
        <Zap className="size-5" aria-hidden />
      </span>
      {showText && <span className={cn('font-display text-lg font-semibold tracking-tight', inverted ? 'text-white' : 'text-fg')}>FocusFlow</span>}
    </div>
  )
}
