import { Inbox } from 'lucide-react'
import { cn } from '../../lib/cn.js'

// `icon` doit être une icône Lucide ; toute autre valeur (ex. un emoji) est remplacée par Inbox.
// `children` = texte d'explication ; `action` = bouton ou lien d'action.
export function EmptyState({ icon, title, children, action, className }) {
  const Icon = icon && typeof icon !== 'string' ? icon : Inbox
  return (
    <div className={cn('flex flex-col items-center rounded-2xl border border-dashed border-line bg-surface/50 px-6 py-10 dark:backdrop-blur-md text-center', className)}>
      <span className="grid size-14 place-items-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
        <Icon className="size-7" aria-hidden />
      </span>
      <h3 className="mt-4 font-display text-base font-semibold text-fg">{title}</h3>
      {children && <p className="mt-1 max-w-sm text-sm text-muted">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export default EmptyState
