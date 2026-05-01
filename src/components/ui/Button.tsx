import { cn } from '@/lib/utils'
import { forwardRef, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'ghost', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 font-medium transition-all duration-150 cursor-pointer select-none',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          // Sizes
          size === 'sm' && 'px-3 py-1.5 text-xs rounded-lg',
          size === 'md' && 'px-4 py-2 text-sm rounded-xl',
          size === 'lg' && 'px-6 py-3 text-base rounded-xl',
          size === 'icon' && 'w-8 h-8 rounded-lg',
          // Variants
          variant === 'primary' && [
            'bg-accent text-white border border-accent',
            'hover:bg-accent-hover hover:border-accent-hover',
            'active:scale-[0.98]',
          ],
          variant === 'ghost' && [
            'bg-transparent text-content-2 border border-transparent',
            'hover:bg-bg-3 hover:text-content',
          ],
          variant === 'outline' && [
            'bg-transparent text-content-2 border border-border-2',
            'hover:bg-bg-3 hover:text-content hover:border-border-3',
          ],
          variant === 'danger' && [
            'bg-transparent text-danger border border-danger/30',
            'hover:bg-danger/10',
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
