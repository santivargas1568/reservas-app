// services/authService.ts
// Autenticación de administradores con bcryptjs + JWT

import bcrypt from 'bcryptjs'
import { getSupabaseAdmin } from '@/lib/supabase'
import { signAdminToken } from '@/lib/auth'
import type { AdminUser, AdminSession } from '@/types/availability'

const SALT_ROUNDS = 12

/**
 * Verifica credenciales de admin y retorna un JWT firmado si son correctas.
 */
export async function loginAdmin(
  email: string,
  password: string
): Promise<{ token: string; session: AdminSession }> {
  if (!email || !password) {
    throw new Error('Email y contraseña son requeridos')
  }

  const supabaseAdmin = getSupabaseAdmin()

  // Buscar admin por email
  const { data: adminUser, error } = await supabaseAdmin
    .from('admin_users')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (error || !adminUser) {
    // Timing-safe: igual tiempo si el usuario no existe
    await bcrypt.compare('dummy', '$2a$12$dummy.hash.to.prevent.timing.attacks')
    throw new Error('Credenciales incorrectas')
  }

  // Verificar contraseña con bcrypt
  const passwordValid = await bcrypt.compare(password, adminUser.password_hash)

  if (!passwordValid) {
    throw new Error('Credenciales incorrectas')
  }

  const session: AdminSession = {
    id: adminUser.id,
    email: adminUser.email,
    full_name: adminUser.full_name,
  }

  const token = await signAdminToken(session)

  return { token, session }
}

/**
 * Crea un nuevo administrador con contraseña hasheada.
 * Solo para uso en scripts de seed o desde el panel super-admin.
 */
export async function createAdmin(
  email: string,
  password: string,
  fullName: string
): Promise<AdminUser> {
  if (password.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres')
  }

  const supabaseAdmin = getSupabaseAdmin()
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .insert({
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      full_name: fullName.trim(),
    })
    .select()
    .single()

  if (error) throw new Error(`Error al crear administrador: ${error.message}`)
  return data as AdminUser
}

/**
 * Cambia la contraseña de un admin.
 */
export async function changeAdminPassword(
  adminId: string,
  newPassword: string
): Promise<void> {
  if (newPassword.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres')
  }

  const supabaseAdmin = getSupabaseAdmin()
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)

  const { error } = await supabaseAdmin
    .from('admin_users')
    .update({ password_hash: passwordHash })
    .eq('id', adminId)

  if (error) throw new Error(`Error al cambiar contraseña: ${error.message}`)
}
