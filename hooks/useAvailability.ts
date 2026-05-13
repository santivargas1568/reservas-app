'use client'
// hooks/useAvailability.ts
// Hook para gestionar disponibilidad en la vista cliente

import { useState, useEffect, useCallback } from 'react'
import type { AvailabilityBlock } from '@/types/block'

interface UseAvailabilityReturn {
  availableDates: string[]
  selectedDate: string | null
  slots: AvailabilityBlock[]
  loadingDates: boolean
  loadingSlots: boolean
  error: string | null
  selectDate: (date: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useAvailability(): UseAvailabilityReturn {
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slots, setSlots] = useState<AvailabilityBlock[]>([])
  const [loadingDates, setLoadingDates] = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDates = useCallback(async () => {
    try {
      setLoadingDates(true)
      const res = await fetch('/api/availability')
      const json = await res.json()
      if (json.success) setAvailableDates(json.data)
      else setError(json.error || 'Error al cargar fechas')
    } catch {
      setError('Error de conexión')
    } finally {
      setLoadingDates(false)
    }
  }, [])

  const selectDate = useCallback(async (date: string) => {
    setSelectedDate(date)
    setSlots([])
    setLoadingSlots(true)
    try {
      const res = await fetch(`/api/availability?date=${date}`)
      const json = await res.json()
      if (json.success) setSlots(json.data)
    } catch {
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    await fetchDates()
    if (selectedDate) await selectDate(selectedDate)
  }, [fetchDates, selectDate, selectedDate])

  useEffect(() => { fetchDates() }, [fetchDates])

  return { availableDates, selectedDate, slots, loadingDates, loadingSlots, error, selectDate, refresh }
}
