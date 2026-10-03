import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'
import { cn } from '../../lib/cn.js'

const tones = {
  info: { icon: Info, cls: 'border-sky-500/30 bg-sky-500/8 text-sky-800 dark:text-sky-200', ic: 'text-sky-500' },
  success: { icon: CircleCheck, cls: 'border-emerald-500/30 bg-emerald-500/8 text-emerald-800 dark:text-emerald-200', ic: 'text-emerald-500' },
  warning: { icon: TriangleAlert, cls: 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200', ic: 'text-amber-500' },
  danger: { icon: CircleAlert, cls: 'border-rose-500/30 bg-rose-500/8 text-rose-800 dark:text-rose-200', ic: 'text-rose-500' },
}

// Message contextuel : `action` = bouton optionnel affiché à droite (ou sous le texte sur mobile).
export function Alert({ tone = 'info', icon, title, children, action, className }) {
  const t = tones[tone]
  const Icon = icon ?? t.icon
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border px-4 py-3 text-sm', t.cls, className)}>
      <Icon className={cn('size-5 shrink-0', t.ic)} aria-hidden />
      <div className="min-w-0 flex-1 basis-48">
        {title && <p className="font-semibold">{title}</p>}
        {children && <p className={title ? 'opacity-90' : ''}>{children}</p>}
      </div>
      {action}
    </div>
  )
}

export default Alert
