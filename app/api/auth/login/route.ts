// app/api/auth/login/route.ts
// Endpoint de login admin. Valida credenciales y crea cookie de sesión.

import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { loginAdmin } from '@/services/authService'
import { createSessionCookie } from '@/lib/auth'
import { errorResponse, successResponse } from '@/lib/utils'

export const runtime = 'nodejs' // bcryptjs requiere Node.js runtime

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return errorResponse('Email y contraseña son requeridos', 400)
    }

    const { token, session } = await loginAdmin(email, password)

    // Crear cookie segura
    const cookie = createSessionCookie(token)
    const cookieStore = await cookies()
    cookieStore.set(cookie.name, cookie.value, cookie.options as Parameters<typeof cookieStore.set>[2])

    return successResponse({ session }, 200)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error de autenticación'
    // No revelar si el usuario existe o no
    return errorResponse('Credenciales incorrectas', 401)
  }
}

export async function DELETE() {
  // Logout: eliminar cookie
  const cookieStore = await cookies()
  cookieStore.delete('reservas_admin_session')
  return successResponse({ message: 'Sesión cerrada' }, 200)
}
