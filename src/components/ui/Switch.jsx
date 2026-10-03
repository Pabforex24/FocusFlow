import { cn } from '../../lib/cn.js'

export function Switch({ checked, onChange, label, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}
      className={cn('relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50', checked ? 'bg-brand-600 dark:bg-brand-500' : 'bg-line')}>
      <span className={cn('inline-block size-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-6' : 'translate-x-1')} />
    </button>
  )
}

export default Switch
