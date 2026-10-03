import { LoaderCircle } from 'lucide-react'
import { cn } from '../../lib/cn.js'

export function Spinner({ className }) {
  return <LoaderCircle className={cn('size-6 animate-spin text-brand-500', className)} aria-label="Chargement" role="status" />
}

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-xl bg-surface-2', className)} aria-hidden />
}

// Squelette d'une page complète : titre, quatre cartes de statistiques, deux blocs.
export function PageSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Chargement de la page">
      <div className="space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64" /></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-56 rounded-2xl" />
    </div>
  )
}

export default PageSkeleton
