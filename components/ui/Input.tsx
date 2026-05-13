'use client'
// components/ui/Input.tsx
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full px-3 py-2.5 border rounded-xl text-sm text-stone-900 bg-white outline-none transition-all duration-150',
        'focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10',
        error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10' : 'border-stone-200 hover:border-stone-300',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export function Label({ children, required, className }: { children: React.ReactNode; required?: boolean; className?: string }) {
  return (
    <label className={cn('text-[13px] font-medium text-stone-500', className)}>
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

export function FormGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex flex-col gap-1.5', className)}>{children}</div>
}

export function FormError({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] text-red-600">{children}</p>
}
