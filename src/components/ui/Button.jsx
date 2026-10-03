import { forwardRef } from 'react'
import { LoaderCircle } from 'lucide-react'
import { cn } from '../../lib/cn.js'

const base =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-semibold select-none transition duration-150 ' +
  'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50'

const variants = {
  primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-500 active:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400',
  secondary: 'border border-line bg-surface text-fg shadow-xs hover:bg-surface-2',
  ghost: 'text-muted hover:bg-surface-2 hover:text-fg',
  danger: 'bg-rose-600 text-white shadow-sm hover:bg-rose-500 active:bg-rose-700',
  'danger-soft': 'text-rose-600 hover:bg-rose-500/10 dark:text-rose-400',
}
const sizes = { sm: 'h-9 px-3 text-sm', md: 'h-11 px-4 text-sm', lg: 'h-12 px-5 text-base' }

// type="button" par défaut : dans un formulaire, passer type="submit" explicitement.
export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight, loading = false, disabled, type = 'button', className, children, ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} disabled={disabled || loading} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : Icon && <Icon className="size-4" aria-hidden />}
      {children}
      {IconRight && !loading && <IconRight className="size-4" aria-hidden />}
    </button>
  )
})

// Bouton carré avec une seule icône : aria-label obligatoire pour l'accessibilité.
export const IconButton = forwardRef(function IconButton(
  { icon: Icon, label, variant = 'ghost', size = 'md', className, ...props },
  ref,
) {
  const dims = size === 'sm' ? 'size-9' : 'size-11 sm:size-10'
  return (
    <button ref={ref} type="button" aria-label={label} title={label}
      className={cn(base, variants[variant], dims, 'rounded-xl', className)} {...props}>
      <Icon className="size-5" aria-hidden />
    </button>
  )
})

export default Button
