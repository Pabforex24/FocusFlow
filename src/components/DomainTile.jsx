import { resolveIcon, tint } from '../lib/icons.js'
import { cn } from '../lib/cn.js'

// Pastille colorée avec l'icône d'un domaine (ou d'un challenge : passer `iconName` et `color`).
export default function DomainTile({ domain, iconName, color, size = 'md', className }) {
  const Icon = resolveIcon(iconName ?? domain?.icon)
  const c = color ?? domain?.color ?? '#4FB286'
  const dims = size === 'sm' ? 'size-8 rounded-lg' : size === 'lg' ? 'size-12 rounded-2xl' : 'size-10 rounded-xl'
  const iconDims = size === 'sm' ? 'size-4' : size === 'lg' ? 'size-6' : 'size-5'
  return (
    <span className={cn('grid shrink-0 place-items-center', dims, className)} style={{ backgroundColor: tint(c, 0.14), color: c }}>
      <Icon className={iconDims} aria-hidden />
    </span>
  )
}
