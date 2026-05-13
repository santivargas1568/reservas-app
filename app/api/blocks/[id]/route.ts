// app/api/blocks/[id]/route.ts
// PATCH  /api/blocks/:id → actualizar bloque (activar/desactivar)
// DELETE /api/blocks/:id → eliminar bloque

import { NextRequest } from 'next/server'
import { updateBlock, deleteBlock } from '@/services/blockService'
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
    const body = await req.json()

    // Solo permitir actualizar campos seguros
    const allowed = ['is_active', 'capacity']
    const payload = Object.fromEntries(
      Object.entries(body).filter(([k]) => allowed.includes(k))
    )

    if (Object.keys(payload).length === 0) {
      return errorResponse('No hay campos válidos para actualizar', 400)
    }

    const block = await updateBlock(id, payload)
    return successResponse(block)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al actualizar bloque'
    return errorResponse(msg, 400)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession()
    if (!session) return errorResponse('No autorizado', 401)

    const { id } = await params
    await deleteBlock(id)
    return successResponse({ message: 'Bloque eliminado' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al eliminar bloque'
    return errorResponse(msg, 400)
  }
}
