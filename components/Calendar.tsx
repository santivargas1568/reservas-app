'use client'
// components/Calendar.tsx
// Calendario interactivo que muestra fechas con disponibilidad

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { todaySantiago } from '@/lib/timezone'

const MONTH_NAMES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]
const DAY_NAMES = ['Do','Lu','Ma','Mi','Ju','Vi','Sa']

interface CalendarProps {
  availableDates: string[]
  selectedDate: string | null
  onSelectDate: (date: string) => void
}

export function Calendar({ availableDates, selectedDate, onSelectDate }: CalendarProps) {
  const today = todaySantiago()
  const [{ year, month }, setMonth] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const availableSet = useMemo(() => new Set(availableDates), [availableDates])

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = useMemo(() => {
    const c: (string | null)[] = Array(firstDayOfMonth).fill(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const m = String(month + 1).padStart(2, '0')
      const ds = String(d).padStart(2, '0')
      c.push(`${year}-${m}-${ds}`)
    }
    return c
  }, [year, month, firstDayOfMonth, daysInMonth])

  const prevMonth = () => setMonth(p =>
    p.month === 0 ? { year: p.year - 1, month: 11 } : { year: p.year, month: p.month - 1 }
  )
  const nextMonth = () => setMonth(p =>
    p.month === 11 ? { year: p.year + 1, month: 0 } : { year: p.year, month: p.month + 1 }
  )

  return (
    <div className="select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-500 transition-colors"
        >‹</button>
        <span className="text-sm font-semibold text-stone-800">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-500 transition-colors"
        >›</button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[11px] font-medium text-stone-400 py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((dateStr, i) => {
          if (!dateStr) return <div key={`e-${i}`} />

          const isPast = dateStr < today
          const isToday = dateStr === today
          const hasSlots = availableSet.has(dateStr)
          const isSelected = selectedDate === dateStr

          return (
            <button
              key={dateStr}
              disabled={isPast || !hasSlots}
              onClick={() => onSelectDate(dateStr)}
              className={cn(
                'aspect-square flex items-center justify-center text-[13px] rounded-lg transition-all duration-100 border',
                // Base
                'border-transparent',
                // Past
                isPast && 'text-stone-300 cursor-not-allowed',
                // Future no slots
                !isPast && !hasSlots && 'text-stone-400 cursor-not-allowed',
                // Available
                !isPast && hasSlots && !isSelected && 'bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-600 hover:text-white hover:border-brand-600 cursor-pointer',
                // Today modifier
                isToday && !isSelected && 'font-semibold',
                // Selected
                isSelected && 'bg-brand-600 text-white border-brand-600 font-semibold',
              )}
              title={hasSlots && !isPast ? 'Horarios disponibles' : ''}
            >
              {parseInt(dateStr.split('-')[2])}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-[11px] text-stone-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-brand-50 border border-brand-200 inline-block" />
          Disponible
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-brand-600 inline-block" />
          Seleccionado
        </span>
      </div>
    </div>
  )
}
