import { RefreshCw, TriangleAlert } from 'lucide-react'
import { Button } from './Button.jsx'

export function ErrorState({ title = 'Impossible de charger vos données', message, onRetry }) {
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-rose-500/30 bg-rose-500/5 px-6 py-10 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
        <TriangleAlert className="size-7" aria-hidden />
      </span>
      <h3 className="mt-4 text-base font-semibold text-fg">{title}</h3>
      {message && <p className="mt-1 text-sm text-muted">{message}</p>}
      {onRetry && <Button className="mt-5" icon={RefreshCw} onClick={onRetry}>Réessayer</Button>}
    </div>
  )
}

export default ErrorState
