'use client'
// components/TimeSlots.tsx
import { cn } from '@/lib/utils'
import { Skeleton } from './ui/Skeleton'
import type { AvailabilityBlock } from '@/types/block'

interface TimeSlotsProps {
  slots: AvailabilityBlock[]
  selectedSlot: AvailabilityBlock | null
  onSelectSlot: (slot: AvailabilityBlock) => void
  loading?: boolean
}

export function TimeSlots({ slots, selectedSlot, onSelectSlot, loading }: TimeSlotsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    )
  }

  if (!slots.length) {
    return (
      <div className="text-center py-8 text-stone-400">
        <div className="text-3xl mb-2 opacity-50">🕐</div>
        <p className="text-sm">Sin horarios disponibles</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {slots.map((slot) => {
        const isSelected = selectedSlot?.id === slot.id
        const isFull = slot.remaining_capacity === 0

        return (
          <button
            key={slot.id}
            disabled={isFull}
            onClick={() => !isFull && onSelectSlot(slot)}
            className={cn(
              'p-3 rounded-xl border text-left transition-all duration-150',
              isFull && 'opacity-40 cursor-not-allowed bg-stone-50 border-stone-200',
              !isFull && !isSelected && 'border-stone-200 hover:border-brand-400 hover:bg-brand-50 cursor-pointer',
              isSelected && 'border-brand-600 bg-brand-600 text-white cursor-pointer',
            )}
          >
            <div className={cn('text-sm font-semibold', isSelected ? 'text-white' : 'text-stone-800')}>
              {slot.start_time} – {slot.end_time}
            </div>
            <div className={cn('text-[11px] mt-0.5', isSelected ? 'text-brand-200' : 'text-stone-400')}>
              {slot.remaining_capacity} cupo{slot.remaining_capacity !== 1 ? 's' : ''}
            </div>
          </button>
        )
      })}
    </div>
  )
}
