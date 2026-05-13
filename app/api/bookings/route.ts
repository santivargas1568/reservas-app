// app/api/bookings/route.ts
// POST /api/bookings → crear reserva (cliente público)
// GET  /api/bookings → listar reservas (admin)

import { NextRequest } from 'next/server'
import { createBookingAtomic } from '@/services/bookingTransactionService'
import { getAllBookings } from '@/services/bookingService'
import { getAdminSession } from '@/lib/auth'
import { errorResponse, successResponse, isValidEmail, isValidPhone } from '@/lib/utils'
import type { CreateBookingPayload } from '@/types/booking'

export const runtime = 'nodejs'

// Crear reserva — público (cualquier cliente puede reservar)
export async function POST(req: NextRequest) {
  try {
    const body: CreateBookingPayload = await req.json()

    // Validaciones
    const required = ['availability_block_id', 'customer_first_name', 'customer_last_name', 'customer_email', 'customer_phone']
    for (const field of required) {
      if (!body[field as keyof CreateBookingPayload]?.toString().trim()) {
        return errorResponse(`Campo requerido: ${field}`, 400)
      }
    }

    if (!isValidEmail(body.customer_email)) {
      return errorResponse('Email inválido', 400)
    }
    if (!isValidPhone(body.customer_phone)) {
      return errorResponse('Teléfono inválido', 400)
    }

    // Transacción atómica con SELECT FOR UPDATE
    const result = await createBookingAtomic(body)

    if (!result.success) {
      return errorResponse(result.error || 'Error al crear reserva', 409)
    }

    return successResponse(result.booking, 201)
  } catch (err) {
    console.error('[API POST /bookings]', err)
    return errorResponse('Error interno del servidor', 500)
  }
}

// Listar reservas — solo admin
export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) return errorResponse('No autorizado', 401)

    const { searchParams } = new URL(req.url)
    const filters = {
      date: searchParams.get('date') || undefined,
      status: (searchParams.get('status') || '') as any,
      email: searchParams.get('email') || undefined,
    }

    const bookings = await getAllBookings(filters)
    return successResponse(bookings)
  } catch (err) {
    console.error('[API GET /bookings]', err)
    return errorResponse('Error al obtener reservas', 500)
  }
}
