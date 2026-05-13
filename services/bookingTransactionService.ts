// services/bookingTransactionService.ts
//
// PIEZA CLAVE: Protección contra doble reserva mediante transacción atómica.
//
// Flujo:
//   1. BEGIN TRANSACTION (implícito en la función SQL)
//   2. SELECT ... FOR UPDATE  → bloquea la fila del bloque
//   3. Validar remaining_capacity > 0
//   4. INSERT booking
//   5. UPDATE remaining_capacity - 1
//   6. COMMIT (al retornar exitosamente)
//   7. ROLLBACK (automático si hay error)
//
// Por qué funciona:
//   Si dos requests llegan simultáneamente al mismo bloque:
//   - Request A adquiere el lock con FOR UPDATE
//   - Request B queda en espera (bloqueado por PostgreSQL)
//   - A valida cupos, crea la reserva, descuenta, hace COMMIT → libera lock
//   - B adquiere el lock, lee remaining_capacity = 0, retorna error
//   → No hay doble reserva posible.

import { getSupabaseAdmin } from '@/lib/supabase'
import type { CreateBookingPayload, Booking } from '@/types/booking'
import { isValidEmail, isValidPhone } from '@/lib/utils'

export interface BookingResult {
  success: boolean
  booking?: Booking
  error?: string
}

/**
 * Crea una reserva de forma atómica usando la función PostgreSQL `create_booking`.
 * Llama via supabase.rpc() para ejecutar SELECT FOR UPDATE en la DB.
 */
export async function createBookingAtomic(
  payload: CreateBookingPayload
): Promise<BookingResult> {
  // Validaciones de entrada (previas a la DB)
  if (!isValidEmail(payload.customer_email)) {
    return { success: false, error: 'El email no es válido' }
  }
  if (!isValidPhone(payload.customer_phone)) {
    return { success: false, error: 'El teléfono no es válido (mínimo 6 caracteres)' }
  }
  if (!payload.customer_first_name?.trim()) {
    return { success: false, error: 'El nombre es requerido' }
  }
  if (!payload.customer_last_name?.trim()) {
    return { success: false, error: 'El apellido es requerido' }
  }

  const supabaseAdmin = getSupabaseAdmin()

  // Llamar la función SQL atómica (SELECT FOR UPDATE + transacción completa)
  const { data, error } = await supabaseAdmin.rpc('create_booking', {
    p_block_id: payload.availability_block_id,
    p_first_name: payload.customer_first_name.trim(),
    p_last_name: payload.customer_last_name.trim(),
    p_email: payload.customer_email.trim().toLowerCase(),
    p_phone: payload.customer_phone.trim(),
    p_comment: payload.customer_comment?.trim() || '',
  })

  if (error) {
    console.error('[BookingTransaction] Supabase RPC error:', error)
    return { success: false, error: 'Error de conexión con la base de datos' }
  }

  if (!data?.success) {
    return { success: false, error: data?.error || 'Error desconocido al crear la reserva' }
  }

  return { success: true, booking: data.booking as Booking }
}

/**
 * Cancela una reserva y recupera el cupo automáticamente.
 * Usa la función SQL `cancel_booking` para garantizar atomicidad.
 */
export async function cancelBookingAtomic(bookingId: string): Promise<BookingResult> {
  const supabaseAdmin = getSupabaseAdmin()

  const { data, error } = await supabaseAdmin.rpc('cancel_booking', {
    p_booking_id: bookingId,
  })

  if (error) {
    console.error('[BookingTransaction] Cancel error:', error)
    return { success: false, error: 'Error al cancelar la reserva' }
  }

  if (!data?.success) {
    return { success: false, error: data?.error || 'Error al cancelar' }
  }

  return { success: true }
}
