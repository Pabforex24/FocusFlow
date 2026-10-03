import { cn } from '../../lib/cn.js'

// Choix unique en pastilles. options = [{ value, label, icon? }]
export function Segmented({ value, onChange, options, className, fill = false }) {
  return (
    <div role="radiogroup" className={cn('inline-flex gap-1 rounded-xl bg-surface-2 p-1', fill && 'flex w-full', className)}>
      {options.map(({ value: v, label, icon: Icon }) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}
          className={cn('inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium transition',
            fill && 'flex-1', value === v ? 'bg-surface text-fg shadow-sm dark:bg-white/10' : 'text-muted hover:text-fg')}>
          {Icon && <Icon className="size-4" aria-hidden />}{label}
        </button>
      ))}
    </div>
  )
}

export default Segmented
