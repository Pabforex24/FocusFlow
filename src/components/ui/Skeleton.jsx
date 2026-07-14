import { cn } from '@/lib/utils'


export function Skeleton({ className }) {
  return (
    <div
      className={cn(
        'animate-pulse bg-bg-3 rounded-lg',
        className
      )}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-bg-2 border border-border rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-11 h-11 rounded-xl" />
        <div className="flex-1">
          <Skeleton className="h-4 w-2/3 mb-2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  )
}

export function SkeletonTask() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-bg-2 border border-border rounded-xl">
      <Skeleton className="w-5 h-5 rounded-md flex-shrink-0" />
      <Skeleton className="flex-1 h-4" />
      <Skeleton className="w-16 h-5 rounded-full" />
    </div>
  )
}
