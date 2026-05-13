'use client'
// app/admin/bookings/page.tsx — Página dedicada de reservas

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookingsTable } from '@/components/BookingsTable'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useBookings } from '@/hooks/useBookings'

export default function AdminBookingsPage() {
  const router = useRouter()
  const { bookings, loading, error, cancelBooking } = useBookings()
  const [filterDate, setFilterDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  const handleCancel = async (id: string) => {
    try {
      await cancelBooking(id)
      showToast('success', 'Reserva cancelada y cupo recuperado')
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Error al cancelar')
      throw err
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {toast && (
        <div className="fixed top-4 right-4 z-50 w-80 animate-slide-up">
          <Alert type={toast.type} onClose={() => setToast(null)}>{toast.msg}</Alert>
        </div>
      )}

      <nav className="bg-white border-b border-stone-200 px-6 h-14 flex items-center justify-between sticky top-0 z-30">
        <span className="font-display text-brand-700 text-xl">ReservasPro</span>
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin')}>← Panel admin</Button>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl text-stone-800">Reservas</h1>
          <p className="text-stone-500 text-sm mt-1">Gestión completa de reservas</p>
        </div>

        {error && <Alert type="error" className="mb-4">{error}</Alert>}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : (
          <BookingsTable
            bookings={bookings}
            onCancel={handleCancel}
            filterDate={filterDate}
            filterStatus={filterStatus}
            onFilterDate={setFilterDate}
            onFilterStatus={setFilterStatus}
          />
        )}
      </main>
    </div>
  )
}
