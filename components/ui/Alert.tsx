'use client'
// components/ui/Alert.tsx
import { cn } from '@/lib/utils'

type AlertType = 'success' | 'error' | 'warn' | 'info'

const styles: Record<AlertType, string> = {
  success: 'bg-brand-50 text-brand-700 border-brand-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  warn: 'bg-amber-50 text-amber-800 border-amber-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
}
const icons: Record<AlertType, string> = {
  success: '✓', error: '✕', warn: '⚠', info: 'ℹ',
}

interface AlertProps {
  type?: AlertType
  children: React.ReactNode
  onClose?: () => void
  className?: string
}

export function Alert({ type = 'info', children, onClose, className }: AlertProps) {
  return (
    <div className={cn('flex items-start gap-2.5 px-4 py-3 rounded-xl border text-sm leading-snug', styles[type], className)}>
      <span className="font-bold flex-shrink-0 mt-0.5">{icons[type]}</span>
      <span className="flex-1">{children}</span>
      {onClose && (
        <button onClick={onClose} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity ml-1">✕</button>
      )}
    </div>
  )
}
