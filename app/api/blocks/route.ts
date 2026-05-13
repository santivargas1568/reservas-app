// app/api/blocks/route.ts
// POST /api/blocks → crear bloques (admin)
// GET  /api/blocks → listar todos los bloques (admin)

import { NextRequest } from 'next/server'
import { createBlocksBulk, getAllBlocks } from '@/services/blockService'
import { getAdminSession } from '@/lib/auth'
import { errorResponse, successResponse } from '@/lib/utils'
import { isFutureOrToday } from '@/lib/timezone'
import type { CreateBlocksPayload, DurationMinutes } from '@/types/block'

export const runtime = 'nodejs'

const VALID_DURATIONS: DurationMinutes[] = [15, 30, 45, 60, 90, 120]

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) return errorResponse('No autorizado', 401)

    const body: CreateBlocksPayload = await req.json()

    // Validaciones
    if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      return errorResponse('Fecha inválida. Use YYYY-MM-DD', 400)
    }
    if (!isFutureOrToday(body.date)) {
      return errorResponse('No puedes crear bloques en fechas pasadas', 400)
    }
    if (!body.start_time || !body.end_time) {
      return errorResponse('Hora de inicio y término son requeridas', 400)
    }
    if (body.start_time >= body.end_time) {
      return errorResponse('La hora de término debe ser posterior a la de inicio', 400)
    }
    if (!VALID_DURATIONS.includes(body.duration_minutes as DurationMinutes)) {
      return errorResponse(`Duración inválida. Opciones: ${VALID_DURATIONS.join(', ')}`, 400)
    }
    if (!body.capacity || body.capacity < 1 || body.capacity > 100) {
      return errorResponse('Los cupos deben estar entre 1 y 100', 400)
    }

    const blocks = await createBlocksBulk(body)
    return successResponse(blocks, 201)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al crear bloques'
    return errorResponse(msg, 400)
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) return errorResponse('No autorizado', 401)

    const blocks = await getAllBlocks()
    return successResponse(blocks)
  } catch (err) {
    return errorResponse('Error al obtener bloques', 500)
  }
}
