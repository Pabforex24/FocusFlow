import { cn } from '../../lib/cn.js'

// Sélection multiple des jours de la semaine. `value` = indices 0 = lundi … 6 = dimanche.
const WEEKDAYS = [['Lun', 0], ['Mar', 1], ['Mer', 2], ['Jeu', 3], ['Ven', 4], ['Sam', 5], ['Dim', 6]]

export function WeekdayPicker({ value = [], onChange, label = 'Jours de la semaine' }) {
  const toggle = (i) => onChange(value.includes(i) ? value.filter((x) => x !== i) : [...value, i].sort((a, b) => a - b))
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {WEEKDAYS.map(([text, i]) => {
        const on = value.includes(i)
        return (
          <button key={i} type="button" aria-pressed={on} onClick={() => toggle(i)}
            className={cn('min-h-11 min-w-12 rounded-xl border px-3 text-sm font-semibold transition active:scale-95',
              on ? 'border-transparent btn-brand' : 'border-line bg-surface text-muted hover:text-fg')}>
            {text}
          </button>
        )
      })}
    </div>
  )
}

export default WeekdayPicker
