// types/availability.ts

import type { AvailabilityBlock } from './block'

export interface AvailabilityByDate {
  date: string
  blocks: AvailabilityBlock[]
  total_slots: number
}

export interface AdminUser {
  id: string
  email: string
  full_name: string
  password_hash: string
  created_at: string
}

export interface AdminSession {
  id: string
  email: string
  full_name: string
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  success: boolean
}
