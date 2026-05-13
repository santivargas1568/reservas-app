// lib/utils.ts
// Utilidades generales del proyecto

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Combina clases Tailwind de forma segura */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Valida formato de email */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

/** Valida formato de teléfono (mínimo 6 caracteres, acepta +56) */
export function isValidPhone(phone: string): boolean {
  return phone.trim().length >= 6
}

/** Formatea hora HH:MM a legible */
export function formatTime(time: string): string {
  return time.substring(0, 5)
}

/** Respuesta JSON de error estandarizada */
export function errorResponse(message: string, status = 400): Response {
  return Response.json({ success: false, error: message }, { status })
}

/** Respuesta JSON de éxito estandarizada */
export function successResponse<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data }, { status })
}
