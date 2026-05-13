'use client'
// components/BookingsTable.tsx — Tabla de reservas para el panel admin

import { useState } from 'react'
import { Badge, StatusDot } from './ui/Badge'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { formatDisplayDate } from '@/lib/timezone'
import type { BookingWithBlock, BookingStatus } from '@/types/booking'

interface BookingsTableProps {
  bookings: BookingWithBlock[]
  onCancel: (id: string) => Promise<void>
  filterDate: string
  filterStatus: string
  onFilterDate: (v: string) => void
  onFilterStatus: (v: string) => void
}

const statusBadge: Record<BookingStatus, { variant: 'green' | 'red' | 'yellow'; label: string }> = {
  confirmed: { variant: 'green', label: 'Confirmada' },
  cancelled: { variant: 'red', label: 'Cancelada' },
  pending: { variant: 'yellow', label: 'Pendiente' },
}

export function BookingsTable({
  bookings,
  onCancel,
  filterDate,
  filterStatus,
  onFilterDate,
  onFilterStatus,
}: BookingsTableProps) {
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const filtered = bookings.filter(b => {
    const date = b.availability_blocks?.date || ''
    if (filterDate && date !== filterDate) return false
    if (filterStatus && b.status !== filterStatus) return false
    return true
  })

  const confirmCancel = async () => {
    if (!cancelId) return
    setCancelling(true)
    await onCancel(cancelId)
    setCancelling(false)
    setCancelId(null)
  }

  return (
    <>
      {/* Confirm cancel modal */}
      <Modal open={!!cancelId} onClose={() => setCancelId(null)} title="¿Cancelar reserva?">
        <p className="text-sm text-stone-600 mb-6">
          Esta acción cancelará la reserva y devolverá el cupo al horario. No se puede deshacer.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setCancelId(null)} disabled={cancelling}>
            No, mantener
          </Button>
          <Button variant="danger" onClick={confirmCancel} loading={cancelling}>
            Sí, cancelar
          </Button>
        </div>
      </Modal>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <input
          type="date"
          value={filterDate}
          onChange={e => onFilterDate(e.target.value)}
          className="px-3 py-2 border border-stone-200 rounded-xl text-sm outline-none focus:border-brand-500 bg-white"
        />
        <select
          value={filterStatus}
          onChange={e => onFilterStatus(e.target.value)}
          className="px-3 py-2 border border-stone-200 rounded-xl text-sm outline-none focus:border-brand-500 bg-white"
        >
          <option value="">Todos los estados</option>
          <option value="confirmed">Confirmadas</option>
          <option value="pending">Pendientes</option>
          <option value="cancelled">Canceladas</option>
        </select>
        {(filterDate || filterStatus) && (
          <Button variant="ghost" size="sm" onClick={() => { onFilterDate(''); onFilterStatus('') }}>
            ✕ Limpiar
          </Button>
        )}
        <span className="ml-auto text-xs text-stone-400">{filtered.length} reserva{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-stone-400">
          <div className="text-4xl mb-3 opacity-40">📋</div>
          <p className="text-sm">Sin reservas{filterDate || filterStatus ? ' con esos filtros' : ' aún'}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Contacto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Fecha</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Horario</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(booking => {
                const block = booking.availability_blocks
                const s = statusBadge[booking.status]
                return (
                  <tr key={booking.id} className="border-t border-stone-100 hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-stone-800">
                        {booking.customer_first_name} {booking.customer_last_name}
                      </div>
                      {booking.customer_comment && (
                        <div className="text-xs text-stone-400 max-w-[180px] truncate mt-0.5">
                          {booking.customer_comment}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-stone-700">{booking.customer_email}</div>
                      <div className="text-xs text-stone-400">{booking.customer_phone}</div>
                    </td>
                    <td className="px-4 py-3 text-stone-600 text-xs whitespace-nowrap">
                      {block?.date ? formatDisplayDate(block.date) : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-stone-800 whitespace-nowrap">
                      {block ? `${block.start_time} – ${block.end_time}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={s.variant}>
                        <StatusDot variant={s.variant} />
                        {s.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {booking.status !== 'cancelled' && (
                        <Button
                          variant="danger-outline"
                          size="sm"
                          onClick={() => setCancelId(booking.id)}
                        >
                          Cancelar
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
