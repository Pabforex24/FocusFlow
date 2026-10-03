import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { Card } from './Card.jsx'
import { cn } from '../../lib/cn.js'

const tones = {
  brand: 'bg-brand-500/10 text-brand-600 dark:text-brand-300',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
  info: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
}
const trendStyles = {
  up: { icon: TrendingUp, cls: 'text-emerald-600 dark:text-emerald-400' },
  down: { icon: TrendingDown, cls: 'text-rose-600 dark:text-rose-400' },
  flat: { icon: Minus, cls: 'text-subtle' },
}

// trend = { value: '+12 %', direction: 'up' | 'down' | 'flat' }
export function StatCard({ icon: Icon, label, value, hint, trend, tone = 'brand', className }) {
  const t = trend && (trendStyles[trend.direction] ?? trendStyles.flat)
  return (
    <Card className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className={cn('grid size-10 place-items-center rounded-xl', tones[tone])}><Icon className="size-5" aria-hidden /></span>
        {t && (
          <span className={cn('inline-flex items-center gap-1 text-xs font-semibold', t.cls)}>
            <t.icon className="size-3.5" aria-hidden />{trend.value}
          </span>
        )}
      </div>
      <div>
        <p className="font-display text-2xl font-bold tracking-tight tabular-nums">{value}</p>
        <p className="text-sm text-muted">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-subtle">{hint}</p>}
      </div>
    </Card>
  )
}

export default StatCard
