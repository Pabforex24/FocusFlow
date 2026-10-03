import { Children, cloneElement, forwardRef, isValidElement, useId } from 'react'
import { Check, ChevronDown, CircleAlert } from 'lucide-react'
import { cn } from '../../lib/cn.js'

// L'apparence des champs vient de index.css (@layer base) : tous les <input>, <select>
// et <textarea> de l'application ont le même style, même sans ces composants.
export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={className} {...props} />
})

export const Textarea = forwardRef(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn('min-h-24 resize-y', className)} {...props} />
})

export const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select ref={ref} className={cn('appearance-none pr-10', className)} {...props}>{children}</select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-subtle" aria-hidden />
    </div>
  )
})

const CONTROLS = ['input', 'select', 'textarea']

// Étiquette + champ + aide/erreur. Relie automatiquement le label au champ s'il est unique.
export function Field({ label, hint, error, htmlFor, className, children }) {
  const autoId = useId()
  const only = Children.count(children) === 1 && isValidElement(children) ? children : null
  const isControl = only && (CONTROLS.includes(only.type) || [Input, Select, Textarea].includes(only.type))
  const id = htmlFor ?? (isControl ? only.props.id ?? autoId : undefined)
  const control = isControl ? cloneElement(only, { id, 'aria-invalid': error ? true : undefined }) : children
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && <label htmlFor={id} className="text-sm font-medium text-fg">{label}</label>}
      {control}
      {error ? (
        <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
          <CircleAlert className="size-3.5 shrink-0" aria-hidden />{error}
        </p>
      ) : hint ? <p className="text-xs text-subtle">{hint}</p> : null}
    </div>
  )
}

export function Checkbox({ label, description, className, ...props }) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-3', className)}>
      <input type="checkbox" className="peer sr-only" {...props} />
      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border border-line bg-surface transition peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-500/25 peer-checked:*:opacity-100">
        <Check className="size-3.5 text-white opacity-0 transition-opacity" aria-hidden />
      </span>
      <span className="text-sm"><span className="font-medium text-fg">{label}</span>
        {description && <span className="block text-muted">{description}</span>}</span>
    </label>
  )
}

export default Field
