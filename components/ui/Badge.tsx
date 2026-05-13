'use client'
// components/ui/Badge.tsx
import { cn } from '@/lib/utils'

type BadgeVariant = 'green' | 'red' | 'yellow' | 'gray' | 'blue'

const variants: Record<BadgeVariant, string> = {
  green: 'bg-brand-50 text-brand-700 border-brand-200',
  red: 'bg-red-50 text-red-800 border-red-200',
  yellow: 'bg-amber-50 text-amber-700 border-amber-200',
  gray: 'bg-stone-100 text-stone-600 border-stone-200',
  blue: 'bg-blue-50 text-blue-800 border-blue-200',
}

export function Badge({
  variant = 'gray',
  children,
  className,
}: {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border', variants[variant], className)}>
      {children}
    </span>
  )
}

export function StatusDot({ variant }: { variant: BadgeVariant }) {
  const colors: Record<BadgeVariant, string> = {
    green: 'bg-brand-500',
    red: 'bg-red-600',
    yellow: 'bg-amber-500',
    gray: 'bg-stone-400',
    blue: 'bg-blue-500',
  }
  return <span className={cn('inline-block w-1.5 h-1.5 rounded-full', colors[variant])} />
}
