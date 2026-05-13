'use client'
// components/ui/Button.tsx
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-outline'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-500 disabled:opacity-50',
  secondary: 'bg-white text-stone-800 border border-stone-200 hover:bg-stone-50 disabled:opacity-50',
  ghost: 'bg-transparent text-stone-500 hover:bg-stone-100 hover:text-stone-800 disabled:opacity-50',
  danger: 'bg-red-800 text-white hover:bg-red-700 disabled:opacity-50',
  'danger-outline': 'bg-transparent text-red-800 border border-red-200 hover:bg-red-50 disabled:opacity-50',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[13px] rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-5 py-2.5 text-[15px] rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 font-medium cursor-pointer transition-all duration-150 whitespace-nowrap',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && <Spinner size="sm" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

// Inline Spinner to avoid circular import
function Spinner({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  return (
    <span
      className={cn(
        'inline-block border-2 border-current border-t-transparent rounded-full animate-spin',
        size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
      )}
    />
  )
}
