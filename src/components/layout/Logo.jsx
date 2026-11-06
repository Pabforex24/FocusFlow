import { Link, useLocation } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { cn } from '../../lib/cn.js'

export default function Logo({ showText = true, inverted = false, className, textClassName }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-linear-to-br from-brand-300 to-brand-500 text-brand-950 shadow-[0_0_14px_rgb(var(--accent-rgb)/0.4)]">
        <Zap className="size-5" aria-hidden />
      </span>
      {showText && <span className={cn('font-display text-lg font-semibold tracking-tight', inverted ? 'text-white' : 'text-fg', textClassName)}>FocusFlow</span>}
    </div>
  )
}

export function LogoLink({ className, ...props }) {
  const { pathname } = useLocation()
  return (
    <Link
      to="/dashboard"
      aria-label="FocusFlow, retour à l'accueil"
      onClick={(event) => {
        if (pathname !== '/dashboard') return
        event.preventDefault()
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
      }}
      className={cn('inline-flex min-h-11 min-w-11 items-center rounded-xl transition hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none', className)}
    >
      <Logo {...props} />
    </Link>
  )
}
