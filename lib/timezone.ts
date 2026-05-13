// lib/timezone.ts
// Centraliza el manejo de timezone America/Santiago
// Evita problemas con UTC, horario de verano y reservas duplicadas por TZ

export const TIMEZONE = 'America/Santiago'

/**
 * Retorna la fecha y hora actual en Santiago.
 */
export function nowInSantiago(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: TIMEZONE }))
}

/**
 * Formatea una fecha a YYYY-MM-DD en timezone Santiago.
 */
export function formatDateSantiago(date: Date): string {
  const d = new Date(date.toLocaleString('en-US', { timeZone: TIMEZONE }))
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Retorna la fecha de hoy en Santiago como YYYY-MM-DD.
 */
export function todaySantiago(): string {
  return formatDateSantiago(nowInSantiago())
}

/**
 * Determina si un bloque (fecha + hora inicio) ya pasó en Santiago.
 */
export function isBlockPast(date: string, startTime: string): boolean {
  const now = nowInSantiago()
  // Construir el datetime del bloque en Santiago
  const blockDateTime = new Date(`${date}T${startTime}:00`)
  return blockDateTime <= now
}

/**
 * Formatea una fecha YYYY-MM-DD a texto legible en español.
 * Ej: "2026-05-20" → "20 de mayo de 2026"
 */
export function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ]
  return `${d} de ${months[m - 1]} de ${y}`
}

/**
 * Verifica que una fecha string no sea anterior a hoy en Santiago.
 */
export function isFutureOrToday(dateStr: string): boolean {
  return dateStr >= todaySantiago()
}
