// services/availabilityService.ts
// Consultas de disponibilidad para la vista cliente

import { supabase } from '@/lib/supabase'
import { todaySantiago, isBlockPast } from '@/lib/timezone'
import type { AvailabilityBlock } from '@/types/block'

/**
 * Retorna las fechas que tienen al menos un bloque disponible.
 * Filtra: activos, con cupos, en el futuro.
 */
export async function getAvailableDates(): Promise<string[]> {
  const today = todaySantiago()

  const { data, error } = await supabase
    .from('availability_blocks')
    .select('date, start_time, is_active, remaining_capacity')
    .gte('date', today)
    .eq('is_active', true)
    .gt('remaining_capacity', 0)
    .order('date')

  if (error) {
    console.error('[AvailabilityService] getAvailableDates:', error)
    return []
  }

  // Filtrar bloques que ya pasaron en timezone Santiago
  const availableDates = new Set<string>()
  for (const block of data || []) {
    if (!isBlockPast(block.date, block.start_time)) {
      availableDates.add(block.date)
    }
  }

  return [...availableDates]
}

/**
 * Retorna los bloques disponibles para una fecha específica.
 * Solo bloques activos, con cupos y en el futuro.
 */
export async function getAvailableBlocksByDate(
  date: string
): Promise<AvailabilityBlock[]> {
  const today = todaySantiago()
  if (date < today) return []

  const { data, error } = await supabase
    .from('availability_blocks')
    .select('*')
    .eq('date', date)
    .eq('is_active', true)
    .gt('remaining_capacity', 0)
    .order('start_time')

  if (error) {
    console.error('[AvailabilityService] getAvailableBlocksByDate:', error)
    return []
  }

  // Filtrar bloques pasados
  return (data || []).filter(
    (b) => !isBlockPast(b.date, b.start_time)
  ) as AvailabilityBlock[]
}
