// lib/auth.ts
// Manejo de sesiones admin con JWT firmado (jose)
// Cookie HttpOnly + Secure + SameSite=Strict

import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { AdminSession } from '@/types/availability'

const COOKIE_NAME = 'reservas_admin_session'
const JWT_EXPIRY = '8h'

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET no configurado en variables de entorno')
  return new TextEncoder().encode(secret)
}

/**
 * Genera un JWT firmado con los datos del admin.
 */
export async function signAdminToken(session: AdminSession): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .setSubject(session.id)
    .sign(getSecret())
}

/**
 * Verifica y decodifica un JWT de admin.
 * Retorna null si es inválido o expirado.
 */
export async function verifyAdminToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return {
      id: payload.sub as string,
      email: payload.email as string,
      full_name: payload.full_name as string,
    }
  } catch {
    return null
  }
}

/**
 * Lee la sesión del admin desde la cookie de la request actual.
 * Para uso en Server Components y API Routes.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyAdminToken(token)
}

/**
 * Crea la cookie de sesión segura.
 * Llamar desde una API Route después de validar credenciales.
 */
export function createSessionCookie(token: string): {
  name: string
  value: string
  options: object
} {
  return {
    name: COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 60 * 60 * 8, // 8 horas
      path: '/',
    },
  }
}

export const SESSION_COOKIE_NAME = COOKIE_NAME
