// types/booking.ts

export type BookingStatus = 'confirmed' | 'pending' | 'cancelled'

export interface Booking {
  id: string
  availability_block_id: string
  customer_first_name: string
  customer_last_name: string
  customer_email: string
  customer_phone: string
  customer_comment: string
  status: BookingStatus
  created_at: string
  updated_at: string
}

export interface BookingWithBlock extends Booking {
  availability_blocks?: {
    date: string
    start_time: string
    end_time: string
    duration_minutes: number
  }
}

export interface CreateBookingPayload {
  availability_block_id: string
  customer_first_name: string
  customer_last_name: string
  customer_email: string
  customer_phone: string
  customer_comment?: string
}

export interface BookingFilters {
  date?: string
  status?: BookingStatus | ''
  email?: string
}
