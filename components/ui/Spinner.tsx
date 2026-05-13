'use client'
// components/ui/Spinner.tsx
import { cn } from '@/lib/utils'

export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'w-3.5 h-3.5 border-2', md: 'w-5 h-5 border-2', lg: 'w-7 h-7 border-[3px]' }
  return (
    <span className={cn('inline-block rounded-full border-current border-t-transparent animate-spin', sizes[size], className)} />
  )
}
