import { cn } from '../../lib/cn.js'

const tones = {
  neutral: 'bg-surface-2 text-muted',
  brand: 'bg-brand-500/10 text-brand-700 dark:text-brand-300',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  warning: 'bg-amber-500/12 text-amber-700 dark:text-amber-400',
  danger: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
  info: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
}

export function Badge({ tone = 'neutral', icon: Icon, className, children }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', tones[tone], className)}>
      {Icon && <Icon className="size-3.5" aria-hidden />}
      {children}
    </span>
  )
}

export default Badge
