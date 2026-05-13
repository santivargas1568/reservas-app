'use client'
// components/ui/Modal.tsx
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  maxWidth?: string
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={cn('bg-white rounded-2xl shadow-lg w-full max-h-[90vh] overflow-y-auto animate-slide-up', maxWidth)}>
        {title && (
          <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
            <h2 className="text-base font-semibold text-stone-800">{title}</h2>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors text-lg leading-none">✕</button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
