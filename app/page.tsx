'use client'
// app/page.tsx — Vista cliente: calendario + selección + formulario + confirmación

import { useState, useEffect, useCallback } from 'react'
import { Calendar } from '@/components/Calendar'
import { TimeSlots } from '@/components/TimeSlots'
import { BookingForm } from '@/components/BookingForm'
import { Alert } from '@/components/ui/Alert'
import { formatDisplayDate } from '@/lib/timezone'
import type { AvailabilityBlock } from '@/types/block'
import type { Booking } from '@/types/booking'

type Step = 'select' | 'form' | 'confirmation'

export default function HomePage() {
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slots, setSlots] = useState<AvailabilityBlock[]>([])
  const [selectedSlot, setSelectedSlot] = useState<AvailabilityBlock | null>(null)
  const [loadingDates, setLoadingDates] = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [step, setStep] = useState<Step>('select')
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null)

  const fetchDates = useCallback(async () => {
    try {
      const res = await fetch('/api/availability')
      const json = await res.json()
      if (json.success) setAvailableDates(json.data)
    } catch {
      // silencioso
    } finally {
      setLoadingDates(false)
    }
  }, [])

  useEffect(() => { fetchDates() }, [fetchDates])

  const handleSelectDate = async (date: string) => {
    setSelectedDate(date)
    setSelectedSlot(null)
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
  }

  const handleBookingSuccess = (booking: Booking) => {
    setConfirmedBooking(booking)
    setStep('confirmation')
    fetchDates() // refrescar disponibilidad
  }

  const reset = () => {
    setStep('select')
    setSelectedDate(null)
    setSelectedSlot(null)
    setConfirmedBooking(null)
    setSlots([])
    fetchDates()
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Nav */}
      <nav className="bg-white border-b border-stone-200 px-6 h-14 flex items-center justify-between sticky top-0 z-30">
        <span className="font-display text-brand-700 text-xl">ReservasPro</span>
        <span className="text-xs text-stone-400 uppercase tracking-wider font-medium">Reservas en línea</span>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-3xl text-stone-800">Reserva tu hora</h1>
          <p className="text-stone-500 text-sm mt-1">Elige el horario que mejor te acomode</p>
        </div>

        {/* Step indicators */}
        {step !== 'confirmation' && (
          <div className="flex items-center gap-0 mb-6">
            {(['select', 'form'] as const).map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`flex items-center gap-2 ${i > 0 ? '' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all
                    ${step === s ? 'bg-brand-600 text-white' : step === 'form' && s === 'select' ? 'bg-brand-600 text-white' : 'bg-stone-200 text-stone-500'}`}>
                    {step === 'form' && s === 'select' ? '✓' : i + 1}
                  </div>
                  <span className={`text-[13px] font-medium hidden sm:inline ${step === s ? 'text-brand-700' : 'text-stone-400'}`}>
                    {s === 'select' ? 'Elige fecha y hora' : 'Tus datos'}
                  </span>
                </div>
                {i < 1 && <div className="w-8 h-px bg-stone-200 mx-2" />}
              </div>
            ))}
          </div>
        )}

        {/* STEP: Select date & slot */}
        {step === 'select' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Calendar */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-soft">
              <h2 className="text-sm font-semibold text-stone-700 mb-4">Selecciona una fecha</h2>
              {loadingDates ? (
                <div className="h-48 flex items-center justify-center text-stone-400 text-sm">Cargando...</div>
              ) : (
                <>
                  <Calendar
                    availableDates={availableDates}
                    selectedDate={selectedDate}
                    onSelectDate={handleSelectDate}
                  />
                  {availableDates.length === 0 && (
                    <Alert type="info" className="mt-3">No hay fechas disponibles en este momento</Alert>
                  )}
                </>
              )}
            </div>

            {/* Slots */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-soft flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-stone-700">
                {selectedDate ? `Horarios — ${formatDisplayDate(selectedDate)}` : 'Horarios disponibles'}
              </h2>
              {!selectedDate ? (
                <div className="flex-1 flex items-center justify-center text-stone-400 text-sm text-center py-8">
                  ← Selecciona una fecha
                </div>
              ) : (
                <>
                  <TimeSlots
                    slots={slots}
                    selectedSlot={selectedSlot}
                    onSelectSlot={setSelectedSlot}
                    loading={loadingSlots}
                  />
                  {selectedSlot && (
                    <button
                      onClick={() => setStep('form')}
                      className="w-full bg-brand-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-brand-500 transition-colors"
                    >
                      Continuar →
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* STEP: Form */}
        {step === 'form' && selectedSlot && selectedDate && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-soft">
            <BookingForm
              slot={selectedSlot}
              date={selectedDate}
              onSuccess={handleBookingSuccess}
              onBack={() => setStep('select')}
            />
          </div>
        )}

        {/* STEP: Confirmation */}
        {step === 'confirmation' && confirmedBooking && (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-soft text-center animate-slide-up">
            <div className="text-5xl mb-4 animate-bounce-in">🎉</div>
            <h2 className="font-display text-2xl text-stone-800 mb-2">¡Reserva confirmada!</h2>
            <p className="text-stone-500 text-sm mb-6">Tu hora ha sido reservada exitosamente.</p>

            <div className="bg-stone-50 rounded-xl p-4 text-left max-w-sm mx-auto mb-6 space-y-2">
              {[
                ['Nombre', `${confirmedBooking.customer_first_name} ${confirmedBooking.customer_last_name}`],
                ['Email', confirmedBooking.customer_email],
                ['Teléfono', confirmedBooking.customer_phone],
                ['N° reserva', confirmedBooking.id.substring(0, 8).toUpperCase()],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-stone-500">{label}</span>
                  <span className="font-medium text-stone-800">{value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={reset}
              className="text-sm text-stone-500 underline hover:text-stone-800 transition-colors"
            >
              Hacer otra reserva
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
