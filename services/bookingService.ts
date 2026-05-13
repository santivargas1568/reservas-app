// services/bookingService.ts
// Consultas de reservas para el panel admin

import { getSupabaseAdmin } from '@/lib/supabase'
import type { BookingWithBlock, BookingFilters } from '@/types/booking'

/**
 * Lista todas las reservas con datos del bloque asociado.
 * Acepta filtros por fecha, estado y email.
 */
export async function getAllBookings(
  filters: BookingFilters = {}
): Promise<BookingWithBlock[]> {
  const supabaseAdmin = getSupabaseAdmin()

  let query = supabaseAdmin
    .from('bookings')
    .select(`
      *,
      availability_blocks (
        date,
        start_time,
        end_time,
        duration_minutes
      )
    `)
    .order('created_at', { ascending: false })

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (filters.email) {
    query = query.ilike('customer_email', `%${filters.email}%`)
  }

  if (filters.date) {
    // Filtrar por fecha del bloque asociado
    query = query.eq('availability_blocks.date', filters.date)
  }

  const { data, error } = await query

  if (error) throw new Error(`Error al obtener reservas: ${error.message}`)
  return data as BookingWithBlock[]
}

/**
 * Retorna estadísticas para el dashboard admin.
 */
export async function getAdminStats() {
  const supabaseAdmin = getSupabaseAdmin()

  const today = new Date().toISOString().split('T')[0]

  const [blocksRes, bookingsRes, todayRes] = await Promise.all([
    supabaseAdmin
      .from('availability_blocks')
      .select('id, is_active', { count: 'exact' }),
    supabaseAdmin
      .from('bookings')
      .select('id, status', { count: 'exact' }),
    supabaseAdmin
      .from('bookings')
      .select('id, status, availability_blocks!inner(date)')
      .eq('availability_blocks.date', today)
      .neq('status', 'cancelled'),
  ])

  const activeBlocks = (blocksRes.data || []).filter((b) => b.is_active).length
  const confirmed = (bookingsRes.data || []).filter((b) => b.status === 'confirmed').length
  const cancelled = (bookingsRes.data || []).filter((b) => b.status === 'cancelled').length
  const todayBookings = todayRes.data?.length || 0

  return { activeBlocks, confirmed, cancelled, todayBookings, total: bookingsRes.count || 0 }
}
