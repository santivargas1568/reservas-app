'use client'
// hooks/useBookings.ts
// Hook para gestionar reservas en el panel admin

import { useState, useEffect, useCallback } from 'react'
import type { BookingWithBlock } from '@/types/booking'
import type { AvailabilityBlock } from '@/types/block'

interface UseBookingsReturn {
  bookings: BookingWithBlock[]
  blocks: AvailabilityBlock[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  cancelBooking: (id: string) => Promise<void>
}

export function useBookings(): UseBookingsReturn {
  const [bookings, setBookings] = useState<BookingWithBlock[]>([])
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const [bRes, rRes] = await Promise.all([
        fetch('/api/blocks'),
        fetch('/api/bookings'),
      ])
      const bJson = await bRes.json()
      const rJson = await rRes.json()
      if (bJson.success) setBlocks(bJson.data)
      if (rJson.success) setBookings(rJson.data)
    } catch {
      setError('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }, [])

  const cancelBooking = useCallback(async (id: string) => {
    const res = await fetch(`/api/bookings/${id}`, { method: 'PATCH' })
    const json = await res.json()
    if (!json.success) throw new Error(json.error || 'Error al cancelar')
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b))
    await refresh()
  }, [refresh])

  useEffect(() => { refresh() }, [refresh])

  return { bookings, blocks, loading, error, refresh, cancelBooking }
}
