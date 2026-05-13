// types/block.ts

export type DurationMinutes = 15 | 30 | 45 | 60 | 90 | 120

export interface AvailabilityBlock {
  id: string
  date: string            // YYYY-MM-DD
  start_time: string      // HH:MM
  end_time: string        // HH:MM
  duration_minutes: DurationMinutes
  capacity: number
  remaining_capacity: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateBlocksPayload {
  date: string
  start_time: string
  end_time: string
  duration_minutes: DurationMinutes
  capacity: number
}

export interface UpdateBlockPayload {
  is_active?: boolean
  capacity?: number
  remaining_capacity?: number
}

export interface GeneratedBlock
  extends Omit<AvailabilityBlock, 'id' | 'created_at' | 'updated_at'> {}
