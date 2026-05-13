'use client'
// components/BookingForm.tsx

import { useState } from 'react'
import { Button } from './ui/Button'
import { Input, Label, FormGroup, FormError } from './ui/Input'
import { Alert } from './ui/Alert'
import { formatDisplayDate } from '@/lib/timezone'
import { isValidEmail, isValidPhone } from '@/lib/utils'
import type { AvailabilityBlock } from '@/types/block'
import type { Booking } from '@/types/booking'

interface BookingFormProps {
  slot: AvailabilityBlock
  date: string
  onSuccess: (booking: Booking) => void
  onBack: () => void
}

interface FormState {
  firstName: string
  lastName: string
  email: string
  phone: string
  comment: string
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
}

export function BookingForm({ slot, date, onSuccess, onBack }: BookingFormProps) {
  const [form, setForm] = useState<FormState>({
    firstName: '', lastName: '', email: '', phone: '', comment: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(p => ({ ...p, [field]: e.target.value }))
    setErrors(p => ({ ...p, [field]: undefined }))
  }

  const validate = (): boolean => {
    const e: FormErrors = {}
    if (!form.firstName.trim()) e.firstName = 'Requerido'
    if (!form.lastName.trim()) e.lastName = 'Requerido'
    if (!isValidEmail(form.email)) e.email = 'Email inválido'
    if (!isValidPhone(form.phone)) e.phone = 'Mínimo 6 caracteres'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    setApiError('')

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          availability_block_id: slot.id,
          customer_first_name: form.firstName,
          customer_last_name: form.lastName,
          customer_email: form.email,
          customer_phone: form.phone,
          customer_comment: form.comment,
        }),
      })

      const json = await res.json()

      if (!json.success) {
        setApiError(json.error || 'Error al crear la reserva')
        return
      }

      onSuccess(json.data as Booking)
    } catch {
      setApiError('Error de conexión. Por favor, intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3">
        <div className="flex justify-between text-sm">
          <span className="text-stone-500">Horario</span>
          <span className="font-semibold text-brand-700">{slot.start_time} – {slot.end_time}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-stone-500">Fecha</span>
          <span className="font-medium text-stone-800">{formatDisplayDate(date)}</span>
        </div>
      </div>

      {apiError && (
        <Alert type="error" onClose={() => setApiError('')}>{apiError}</Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormGroup>
          <Label required>Nombre</Label>
          <Input value={form.firstName} onChange={set('firstName')} placeholder="María" error={!!errors.firstName} />
          {errors.firstName && <FormError>{errors.firstName}</FormError>}
        </FormGroup>
        <FormGroup>
          <Label required>Apellido</Label>
          <Input value={form.lastName} onChange={set('lastName')} placeholder="González" error={!!errors.lastName} />
          {errors.lastName && <FormError>{errors.lastName}</FormError>}
        </FormGroup>
      </div>

      <FormGroup>
        <Label required>Email</Label>
        <Input type="email" value={form.email} onChange={set('email')} placeholder="maria@email.com" error={!!errors.email} />
        {errors.email && <FormError>{errors.email}</FormError>}
      </FormGroup>

      <FormGroup>
        <Label required>Teléfono</Label>
        <Input type="tel" value={form.phone} onChange={set('phone')} placeholder="+56 9 1234 5678" error={!!errors.phone} />
        {errors.phone && <FormError>{errors.phone}</FormError>}
      </FormGroup>

      <FormGroup>
        <Label>Comentario <span className="text-stone-400 font-normal">(opcional)</span></Label>
        <textarea
          value={form.comment}
          onChange={set('comment')}
          placeholder="Alguna indicación adicional..."
          rows={2}
          className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-900 bg-white outline-none resize-none transition-all duration-150 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 hover:border-stone-300"
        />
      </FormGroup>

      <div className="flex gap-2 pt-1">
        <Button variant="secondary" onClick={onBack} disabled={loading}>← Atrás</Button>
        <Button className="flex-1" size="lg" onClick={handleSubmit} loading={loading}>
          Confirmar reserva
        </Button>
      </div>
    </div>
  )
}
