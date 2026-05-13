// services/blockService.ts
// Operaciones CRUD de bloques para el panel admin

import { getSupabaseAdmin } from '@/lib/supabase'
import { generateBlocks } from './blockGenerator'
import type { AvailabilityBlock, CreateBlocksPayload, UpdateBlockPayload } from '@/types/block'

/**
 * Crea múltiples bloques en bulk a partir de un rango horario.
 * Retorna los bloques insertados.
 */
export async function createBlocksBulk(
  payload: CreateBlocksPayload
): Promise<AvailabilityBlock[]> {
  const supabaseAdmin = getSupabaseAdmin()
  const blocks = generateBlocks(payload)

  const { data, error } = await supabaseAdmin
    .from('availability_blocks')
    .insert(blocks)
    .select()

  if (error) throw new Error(`Error al crear bloques: ${error.message}`)
  return data as AvailabilityBlock[]
}

/**
 * Lista todos los bloques (para el panel admin, sin filtros de RLS).
 */
export async function getAllBlocks(): Promise<AvailabilityBlock[]> {
  const supabaseAdmin = getSupabaseAdmin()

  const { data, error } = await supabaseAdmin
    .from('availability_blocks')
    .select('*')
    .order('date')
    .order('start_time')

  if (error) throw new Error(`Error al obtener bloques: ${error.message}`)
  return data as AvailabilityBlock[]
}

/**
 * Actualiza un bloque (activar/desactivar, editar cupos).
 */
export async function updateBlock(
  id: string,
  payload: UpdateBlockPayload
): Promise<AvailabilityBlock> {
  const supabaseAdmin = getSupabaseAdmin()

  const { data, error } = await supabaseAdmin
    .from('availability_blocks')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Error al actualizar bloque: ${error.message}`)
  return data as AvailabilityBlock
}

/**
 * Elimina un bloque. No elimina reservas existentes (FK RESTRICT).
 */
export async function deleteBlock(id: string): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin()

  const { error } = await supabaseAdmin
    .from('availability_blocks')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`Error al eliminar bloque: ${error.message}`)
}
