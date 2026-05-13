'use client'
// app/admin/page.tsx — Panel principal del administrador

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BlockForm } from '@/components/BlockForm'
import { BookingsTable } from '@/components/BookingsTable'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Badge, StatusDot } from '@/components/ui/Badge'
import { Toggle } from '@/components/ui/Toggle'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDisplayDate } from '@/lib/timezone'
import type { AvailabilityBlock } from '@/types/block'
import type { BookingWithBlock } from '@/types/booking'

type Tab = 'blocks' | 'bookings'

interface Stats {
  activeBlocks: number
  confirmed: number
  cancelled: number
  todayBookings: number
  total: number
}

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('blocks')
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([])
  const [bookings, setBookings] = useState<BookingWithBlock[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBlockForm, setShowBlockForm] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [filterDate, setFilterDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchData = useCallback(async () => {
    try {
      const [blocksRes, bookingsRes] = await Promise.all([
        fetch('/api/blocks'),
        fetch('/api/bookings'),
      ])
      const bj = await blocksRes.json()
      const rj = await bookingsRes.json()
      if (bj.success) setBlocks(bj.data)
      if (rj.success) setBookings(rj.data)

      // Stats
      const confirmed = rj.data?.filter((b: BookingWithBlock) => b.status === 'confirmed').length || 0
      const cancelled = rj.data?.filter((b: BookingWithBlock) => b.status === 'cancelled').length || 0
      const activeBlocks = bj.data?.filter((b: AvailabilityBlock) => b.is_active).length || 0
      const today = new Date().toISOString().split('T')[0]
      const todayBookings = rj.data?.filter((b: BookingWithBlock) =>
        b.availability_blocks?.date === today && b.status === 'confirmed'
      ).length || 0
      setStats({ activeBlocks, confirmed, cancelled, todayBookings, total: rj.data?.length || 0 })
    } catch (err) {
      showToast('error', 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleLogout = async () => {
    await fetch('/api/auth/login', { method: 'DELETE' })
    router.push('/admin/login')
  }

  const handleToggleBlock = async (block: AvailabilityBlock) => {
    try {
      const res = await fetch(`/api/blocks/${block.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !block.is_active }),
      })
      const json = await res.json()
      if (json.success) {
        setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, is_active: !b.is_active } : b))
      }
    } catch {
      showToast('error', 'Error al actualizar el bloque')
    }
  }

  const handleDeleteBlock = async (id: string) => {
    if (!confirm('¿Eliminar este bloque? Las reservas existentes no se eliminarán.')) return
    try {
      const res = await fetch(`/api/blocks/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setBlocks(prev => prev.filter(b => b.id !== id))
        showToast('success', 'Bloque eliminado')
      } else {
        showToast('error', json.error || 'Error al eliminar')
      }
    } catch {
      showToast('error', 'Error al eliminar el bloque')
    }
  }

  const handleCancelBooking = async (id: string) => {
    const res = await fetch(`/api/bookings/${id}`, { method: 'PATCH' })
    const json = await res.json()
    if (json.success) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b))
      fetchData()
      showToast('success', 'Reserva cancelada y cupo recuperado')
    } else {
      showToast('error', json.error || 'Error al cancelar')
      throw new Error(json.error)
    }
  }

  const sortedBlocks = [...blocks].sort((a, b) =>
    a.date !== b.date ? a.date.localeCompare(b.date) : a.start_time.localeCompare(b.start_time)
  )

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 w-80 animate-slide-up">
          <Alert type={toast.type} onClose={() => setToast(null)}>{toast.msg}</Alert>
        </div>
      )}

      {showBlockForm && (
        <BlockForm
          open={showBlockForm}
          onClose={() => setShowBlockForm(false)}
          onSuccess={(count) => {
            showToast('success', `${count} bloque${count !== 1 ? 's' : ''} creado${count !== 1 ? 's' : ''} exitosamente`)
            fetchData()
          }}
        />
      )}

      {/* Nav */}
      <nav className="bg-white border-b border-stone-200 px-6 h-14 flex items-center justify-between sticky top-0 z-30">
        <span className="font-display text-brand-700 text-xl">ReservasPro</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-400 hidden sm:block">Panel administrador</span>
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>← Vista cliente</Button>
          <Button variant="secondary" size="sm" onClick={handleLogout}>Cerrar sesión</Button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl text-stone-800">Panel admin</h1>
            <p className="text-stone-500 text-sm mt-1">Gestión de horarios y reservas</p>
          </div>
          <Button onClick={() => setShowBlockForm(true)} size="lg">
            + Crear horarios
          </Button>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Bloques activos', value: stats.activeBlocks, sub: 'Total en sistema' },
              { label: 'Confirmadas', value: stats.confirmed, sub: 'Estado confirmado', color: 'text-brand-600' },
              { label: 'Hoy', value: stats.todayBookings, sub: 'Reservas de hoy' },
              { label: 'Canceladas', value: stats.cancelled, sub: 'Cupos recuperados', color: 'text-red-600' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-stone-200 rounded-xl p-4">
                <div className="text-xs font-medium text-stone-400 uppercase tracking-wide">{s.label}</div>
                <div className={`text-3xl font-semibold mt-1 ${s.color || 'text-stone-800'}`}>{s.value}</div>
                <div className="text-xs text-stone-400 mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-stone-200 mb-6 gap-1">
          {(['blocks', 'bookings'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              {t === 'blocks' ? `Horarios (${blocks.length})` : `Reservas (${bookings.filter(b => b.status !== 'cancelled').length})`}
            </button>
          ))}
        </div>

        {/* BLOCKS tab */}
        {tab === 'blocks' && (
          loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : sortedBlocks.length === 0 ? (
            <div className="text-center py-16 text-stone-400">
              <div className="text-4xl mb-3 opacity-40">📅</div>
              <p className="font-medium text-stone-600 mb-1">Sin horarios creados</p>
              <p className="text-sm mb-4">Crea tu primer bloque de horarios</p>
              <Button onClick={() => setShowBlockForm(true)}>+ Crear horarios</Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-stone-200">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Fecha</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Horario</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Duración</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Cupos</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Estado</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBlocks.map(block => {
                    const isPast = new Date(`${block.date}T${block.start_time}`) <= new Date()
                    return (
                      <tr key={block.id} className={`border-t border-stone-100 hover:bg-stone-50 transition-colors ${isPast ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-stone-800">{formatDisplayDate(block.date)}</div>
                          {isPast && <Badge variant="gray" className="mt-0.5 text-[10px]">Pasado</Badge>}
                        </td>
                        <td className="px-4 py-3 font-semibold text-stone-800">{block.start_time} – {block.end_time}</td>
                        <td className="px-4 py-3 text-stone-500">{block.duration_minutes} min</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-stone-800">{block.remaining_capacity}</span>
                          <span className="text-stone-400 text-xs"> / {block.capacity}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Toggle
                            checked={block.is_active}
                            onChange={() => !isPast && handleToggleBlock(block)}
                            label={block.is_active ? 'Activo' : 'Inactivo'}
                            disabled={isPast}
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteBlock(block.id)}
                            className="text-stone-400 hover:text-red-600 transition-colors p-1"
                            title="Eliminar"
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* BOOKINGS tab */}
        {tab === 'bookings' && (
          loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : (
            <BookingsTable
              bookings={bookings}
              onCancel={handleCancelBooking}
              filterDate={filterDate}
              filterStatus={filterStatus}
              onFilterDate={setFilterDate}
              onFilterStatus={setFilterStatus}
            />
          )
        )}
      </main>
    </div>
  )
}
