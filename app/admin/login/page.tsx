'use client'
// app/admin/login/page.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input, Label, FormGroup } from '@/components/ui/Input'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email y contraseña son requeridos')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const json = await res.json()

      if (!json.success) {
        setError('Credenciales incorrectas')
        return
      }

      router.push('/admin')
      router.refresh()
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="bg-white border border-stone-200 rounded-2xl shadow-md p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="font-display text-2xl text-brand-700">ReservasPro</span>
          <p className="text-sm text-stone-500 mt-1">Panel de administración</p>
        </div>

        {error && <Alert type="error" className="mb-4">{error}</Alert>}

        <div className="space-y-4">
          <FormGroup>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@tudominio.cl"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </FormGroup>

          <FormGroup>
            <Label>Contraseña</Label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </FormGroup>

          <Button
            className="w-full"
            size="lg"
            onClick={handleLogin}
            loading={loading}
          >
            Ingresar
          </Button>
        </div>
      </div>
    </div>
  )
}
