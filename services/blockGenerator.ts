// services/blockGenerator.ts
// Genera bloques de tiempo automáticamente a partir de un rango horario.
// Ejemplo: 09:00 – 13:00 con duración 30 min → 8 bloques.

import type { CreateBlocksPayload, GeneratedBlock } from '@/types/block'

/**
 * Convierte HH:MM a minutos desde medianoche.
 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/**
 * Convierte minutos desde medianoche a HH:MM.
 */
function minutesToTime(minutes: number): string {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0')
  const m = String(minutes % 60).padStart(2, '0')
  return `${h}:${m}`
}

/**
 * Genera los bloques de disponibilidad para un rango horario.
 *
 * @param payload - Datos del rango (fecha, inicio, fin, duración, cupos)
 * @returns Array de bloques listos para insertar en la DB
 */
export function generateBlocks(payload: CreateBlocksPayload): GeneratedBlock[] {
  const { date, start_time, end_time, duration_minutes, capacity } = payload

  const startMin = timeToMinutes(start_time)
  const endMin = timeToMinutes(end_time)

  if (endMin <= startMin) {
    throw new Error('La hora de término debe ser posterior a la hora de inicio')
  }

  if (capacity < 1 || capacity > 100) {
    throw new Error('Los cupos deben estar entre 1 y 100')
  }

  const blocks: GeneratedBlock[] = []
  let current = startMin

  while (current + duration_minutes <= endMin) {
    blocks.push({
      date,
      start_time: minutesToTime(current),
      end_time: minutesToTime(current + duration_minutes),
      duration_minutes,
      capacity,
      remaining_capacity: capacity,
      is_active: true,
    })
    current += duration_minutes
  }

  if (blocks.length === 0) {
    throw new Error(
      'El rango horario no permite generar ningún bloque con la duración seleccionada'
    )
  }

  return blocks
}
