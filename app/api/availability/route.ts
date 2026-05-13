// app/api/availability/route.ts
// GET /api/availability?date=YYYY-MM-DD → bloques para esa fecha
// GET /api/availability             → fechas con disponibilidad

import { NextRequest } from 'next/server'
import { getAvailableDates, getAvailableBlocksByDate } from '@/services/availabilityService'
import { errorResponse, successResponse } from '@/lib/utils'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')

    if (date) {
      // Validar formato YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return errorResponse('Formato de fecha inválido. Use YYYY-MM-DD', 400)
      }
      const blocks = await getAvailableBlocksByDate(date)
      return successResponse(blocks)
    }

    // Sin date → retornar fechas disponibles
    const dates = await getAvailableDates()
    return successResponse(dates)
  } catch (err) {
    console.error('[API /availability]', err)
    return errorResponse('Error al obtener disponibilidad', 500)
  }
}
