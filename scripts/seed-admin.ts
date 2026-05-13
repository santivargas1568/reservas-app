#!/usr/bin/env node
// scripts/seed-admin.ts
// Crea el primer administrador en la base de datos.
// Uso: npx ts-node scripts/seed-admin.ts
//   o: npx tsx scripts/seed-admin.ts

import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const email = process.env.ADMIN_DEFAULT_EMAIL || 'admin@tudominio.cl'
  const password = process.env.ADMIN_DEFAULT_PASSWORD || 'CambiaMeAhora123!'
  const fullName = 'Administrador'

  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Faltan variables NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  console.log(`🔐 Creando administrador: ${email}`)

  const supabase = createClient(supabaseUrl, serviceKey)
  const passwordHash = await bcrypt.hash(password, 12)

  const { data, error } = await supabase
    .from('admin_users')
    .upsert({ email, password_hash: passwordHash, full_name: fullName }, { onConflict: 'email' })
    .select()

  if (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }

  console.log('✅ Administrador creado exitosamente')
  console.log(`   Email: ${email}`)
  console.log(`   Contraseña: ${password}`)
  console.log('\n⚠️  Cambia la contraseña después del primer login.')
}

main()
