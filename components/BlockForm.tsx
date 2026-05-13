'use client'
// components/BlockForm.tsx — Formulario admin para crear bloques horarios

import { useState, useEffect } from 'react'
import { Button } from './ui/Button'
import { Input, Label, FormGroup } from './ui/Input'
import { Alert } from './ui/Alert'
import { Modal } from './ui/Modal'
import { generateBlocks } from '@/services/blockGenerator'
import { todaySantiago } from '@/lib/timezone'
import type { CreateBlocksPayload, DurationMinutes } from '@/types/block'

interface BlockFormProps {
  open: boolean
  onClose: () => void
  onSuccess: (count: number) => void
}

const DURATIONS: { value: DurationMinutes; label: string }[] = [
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1.5 horas' },
  { value: 120, label: '2 horas' },
]

export function BlockForm({ open, onClose, onSuccess }: BlockFormProps) {
  const today = todaySantiago()
  const [form, setForm] = useState({
    date: today,
    startTime: '09:00',
    endTime: '13:00',
    duration: 30 as DurationMinutes,
    capacity: 1,
  })
  const [preview, setPreview] = useState<string[]>([])
  const [previewError, setPreviewError] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = ['duration', 'capacity'].includes(field) ? Number(e.target.value) : e.target.value
    setForm(p => ({ ...p, [field]: value }))
  }

  // Actualizar preview cuando cambia el formulario
  useEffect(() => {
    try {
      const blocks = generateBlocks({
        date: form.date,
        start_time: form.startTime,
        end_time: form.endTime,
        duration_minutes: form.duration,
        capacity: form.capacity,
      })
      setPreview(blocks.map(b => `${b.start_time}–${b.end_time}`))
      setPreviewError('')
    } catch (err) {
      setPreview([])
      setPreviewError(err instanceof Error ? err.message : 'Error en la configuración')
    }
  }, [form])

  const handleCreate = async () => {
    if (preview.length === 0) return
    setLoading(true)
    setApiError('')

    try {
      const payload: CreateBlocksPayload = {
        date: form.date,
        start_time: form.startTime,
        end_time: form.endTime,
        duration_minutes: form.duration,
        capacity: form.capacity,
      }

      const res = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (!json.success) {
        setApiError(json.error || 'Error al crear los bloques')
        return
      }

      onSuccess(json.data.length)
      onClose()
    } catch {
      setApiError('Error de conexión. Por favor, intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Crear horarios disponibles" maxWidth="max-w-lg">
      <div className="space-y-4">
        {apiError && <Alert type="error" onClose={() => setApiError('')}>{apiError}</Alert>}

        <FormGroup>
          <Label required>Fecha</Label>
          <Input type="date" value={form.date} min={today} onChange={set('date')} />
        </FormGroup>

        <div className="grid grid-cols-2 gap-3">
          <FormGroup>
            <Label required>Hora inicio</Label>
            <Input type="time" value={form.startTime} onChange={set('startTime')} />
          </FormGroup>
          <FormGroup>
            <Label required>Hora término</Label>
            <Input type="time" value={form.endTime} onChange={set('endTime')} />
          </FormGroup>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormGroup>
            <Label>Duración por bloque</Label>
            <select
              value={form.duration}
              onChange={set('duration')}
              className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-900 bg-white outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10"
            >
              {DURATIONS.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </FormGroup>
          <FormGroup>
            <Label>Cupos por bloque</Label>
            <Input type="number" min="1" max="100" value={form.capacity} onChange={set('capacity')} />
          </FormGroup>
        </div>

        {/* Vista previa */}
        <div className="bg-stone-50 rounded-xl p-3 min-h-16">
          {previewError ? (
            <p className="text-xs text-amber-700">{previewError}</p>
          ) : preview.length > 0 ? (
            <>
              <p className="text-xs font-medium text-stone-500 mb-2">
                {preview.length} bloque{preview.length !== 1 ? 's' : ''} a crear:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {preview.map((p, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 bg-brand-50 text-brand-700 border border-brand-200 rounded-lg font-medium">
                    {p}
                  </span>
                ))}
              </div>
            </>
          ) : null}
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={loading} className="flex-shrink-0">
            Cancelar
          </Button>
          <Button
            className="flex-1"
            onClick={handleCreate}
            loading={loading}
            disabled={preview.length === 0 || loading}
          >
            Crear {preview.length > 0 ? `${preview.length} bloques` : 'bloques'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
