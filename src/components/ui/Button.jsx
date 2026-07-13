import { cn } from '@/lib/utils'
import { forwardRef, ButtonHTMLAttributes } from 'react'


export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'ghost', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 font-semibold transition-all duration-200 cursor-pointer select-none relative overflow-hidden',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          // Sizes
          size === 'sm'   && 'px-3 py-1.5 text-xs rounded-xl',
          size === 'md'   && 'px-4 py-2 text-sm rounded-xl',
          size === 'lg'   && 'px-6 py-3 text-sm rounded-2xl',
          size === 'icon' && 'w-8 h-8 rounded-xl',
          // Variants
          variant === 'primary' && [
            'bg-accent text-bg border border-accent/40',
            'hover:bg-accent-hover shadow-glow-sm hover:shadow-glow-accent',
            'active:scale-[0.97]',
          ],
          variant === 'glass' && [
            'glass text-content border border-white/[0.06]',
            'hover:bg-white/[0.05] hover:border-white/[0.10]',
            'active:scale-[0.97]',
          ],
          variant === 'ghost' && [
            'bg-transparent text-content-2 border border-transparent',
            'hover:bg-bg-3 hover:text-content hover:border-border',
          ],
          variant === 'outline' && [
            'bg-transparent text-content-2 border border-border-2',
            'hover:bg-bg-3 hover:text-content hover:border-border-3',
            'active:scale-[0.97]',
          ],
          variant === 'danger' && [
            'bg-transparent text-danger border border-danger/25',
            'hover:bg-danger/10 hover:border-danger/40',
          ],
          variant === 'copper' && [
            'text-copper border border-copper/30',
            'bg-copper/[0.08] hover:bg-copper/[0.14]',
            'active:scale-[0.97]',
          ],
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
