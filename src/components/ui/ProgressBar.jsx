import { useId } from 'react'
import { cn } from '../../lib/cn.js'

const fills = { brand: 'bg-linear-to-r from-brand-700 to-brand-400 shadow-[0_0_8px_rgb(var(--accent-rgb)/0.35)]', success: 'bg-emerald-500', warning: 'bg-amber-500', danger: 'bg-rose-500', info: 'bg-sky-500' }
const strokes = { brand: 'stroke-brand-500', success: 'stroke-emerald-500', warning: 'stroke-amber-500', danger: 'stroke-rose-500', info: 'stroke-sky-500' }
const clamp = (v) => Math.min(100, Math.max(0, Math.round(Number(v) || 0)))

// `color` (ex. couleur d'un domaine) a priorité sur `tone`.
export function ProgressBar({ value = 0, tone = 'brand', color, size = 'md', className }) {
  const pct = clamp(value)
  return (
    <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
      className={cn('w-full overflow-hidden rounded-full bg-surface-2', size === 'sm' ? 'h-1.5' : 'h-2.5', className)}>
      <div className={cn('h-full rounded-full transition-[width] duration-500 ease-out', !color && fills[tone])}
        style={{ width: `${pct}%`, ...(color ? { backgroundColor: color } : null) }} />
    </div>
  )
}

// Indicateur circulaire ; le contenu central est libre (par défaut : le pourcentage).
export function ProgressRing({ value = 0, size = 72, stroke = 7, tone = 'brand', children }) {
  const pct = clamp(value)
  const gid = useId()
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  return (
    <div className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}
      role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs><linearGradient id={gid} x1="0" y1="0" x2="1" y2="1"><stop offset="0" style={{ stopColor: 'var(--color-brand-300)' }} /><stop offset="1" style={{ stopColor: 'var(--color-brand-500)' }} /></linearGradient></defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-line" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} strokeLinecap="round"
          stroke={tone === 'brand' ? `url(#${gid})` : undefined}
          className={cn('transition-[stroke-dashoffset] duration-700 ease-out', tone === 'brand' ? 'drop-shadow-[0_0_5px_rgb(var(--accent-rgb)/0.55)]' : strokes[tone])}
          strokeDasharray={circumference} strokeDashoffset={circumference * (1 - pct / 100)} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-sm font-semibold tabular-nums">{children ?? `${pct}%`}</div>
    </div>
  )
}

export default ProgressBar
