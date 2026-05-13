// app/api/bookings/[id]/route.ts
// PATCH /api/bookings/:id → cancelar reserva (admin)

import { NextRequest } from 'next/server'
import { cancelBookingAtomic } from '@/services/bookingTransactionService'
import { getAdminSession } from '@/lib/auth'
import { errorResponse, successResponse } from '@/lib/utils'

export const runtime = 'nodejs'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession()
    if (!session) return errorResponse('No autorizado', 401)

    const { id } = await params
    if (!id) return errorResponse('ID de reserva requerido', 400)

    const result = await cancelBookingAtomic(id)

    if (!result.success) {
      return errorResponse(result.error || 'Error al cancelar', 400)
    }

    return successResponse({ message: 'Reserva cancelada correctamente' })
  } catch (err) {
    console.error('[API PATCH /bookings/:id]', err)
    return errorResponse('Error interno del servidor', 500)
  }
}
