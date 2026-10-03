import { cn } from '../../lib/cn.js'

export function Card({ as: Tag = 'div', interactive = false, padded = true, className, ...props }) {
  return (
    <Tag
      className={cn(
        'rounded-2xl border border-line bg-surface shadow-card dark:bg-surface/70 dark:backdrop-blur-md',
        padded && 'p-4 sm:p-5',
        interactive && 'transition duration-200 hover:-translate-y-0.5 hover:border-brand-400/40 hover:shadow-pop',
        className,
      )}
      {...props}
    />
  )
}

// En-tête de carte : icône optionnelle, titre, description et action à droite.
export function CardHeader({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-3', className)}>
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
            <Icon className="size-5" aria-hidden />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate font-display text-base font-semibold text-fg">{title}</h2>
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

export default Card
