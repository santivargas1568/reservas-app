# ReservasPro 📅

Sistema web profesional de reservas de horarios con disponibilidad en tiempo real.

**Stack:** Next.js 15 · TypeScript · Tailwind CSS · Supabase · PostgreSQL

---

## Índice

1. [Instalación local](#1-instalación-local)
2. [Configurar Supabase](#2-configurar-supabase)
3. [Ejecutar migraciones SQL](#3-ejecutar-migraciones-sql)
4. [Variables de entorno](#4-variables-de-entorno)
5. [Crear administrador](#5-crear-administrador)
6. [Ejecutar en desarrollo](#6-ejecutar-en-desarrollo)
7. [Deploy en Cloudflare Pages](#7-deploy-en-cloudflare-pages)
8. [Conectar con GitHub](#8-conectar-con-github)
9. [Dominio personalizado](#9-dominio-personalizado)
10. [Cambiar contraseña admin](#10-cambiar-contraseña-admin)
11. [Personalizar branding](#11-personalizar-branding)
12. [Probar concurrencia](#12-probar-concurrencia)
13. [Estructura del proyecto](#13-estructura-del-proyecto)
14. [API Reference](#14-api-reference)

---

## 1. Instalación local

### Requisitos

- Node.js 18 o superior
- npm o pnpm
- Cuenta en [Supabase](https://supabase.com) (gratis)
- Cuenta en [Cloudflare](https://cloudflare.com) (gratis)

### Pasos

```bash
# 1. Descomprime el proyecto y entra a la carpeta
cd reservas-app

# 2. Instala dependencias
npm install

# 3. Copia el archivo de variables de entorno
cp .env.example .env.local

# 4. Edita .env.local con tus datos (ver sección 4)
```

---

## 2. Configurar Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Clic en **New Project**
3. Completa:
   - **Name:** reservas-app (o el nombre que quieras)
   - **Database Password:** genera una contraseña segura y guárdala
   - **Region:** South America (São Paulo) — más cercana a Chile
4. Espera ~2 minutos a que se cree el proyecto
5. Ve a **Project Settings → API**
6. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

---

## 3. Ejecutar migraciones SQL

1. En tu proyecto de Supabase, ve a **SQL Editor**
2. Clic en **New query**
3. Abre el archivo `supabase/migrations/001_initial.sql`
4. Copia todo el contenido y pégalo en el editor
5. Clic en **Run** (o Ctrl+Enter)

Esto crea:
- Tablas `admin_users`, `availability_blocks`, `bookings`, `recurrence_rules`
- Función `create_booking` con `SELECT FOR UPDATE` (protección anti doble reserva)
- Función `cancel_booking`
- Row Level Security (RLS)
- Índices optimizados
- Triggers de `updated_at`

---

## 4. Variables de entorno

Edita `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

ADMIN_DEFAULT_EMAIL=admin@tudominio.cl
ADMIN_DEFAULT_PASSWORD=TuContraseñaSegura123!

# Genera con: node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
JWT_SECRET=tu_secreto_muy_largo_y_aleatorio_aqui

NEXT_PUBLIC_APP_URL=https://tu-dominio.com
NEXT_PUBLIC_APP_NAME=ReservasPro
```

### Generar JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

---

## 5. Crear administrador

### Opción A — Script automático (recomendado)

```bash
# Con las variables en .env.local ya configuradas:
npx tsx scripts/seed-admin.ts
```

### Opción B — SQL directo en Supabase

1. Genera el hash de tu contraseña con Node.js:

```bash
node -e "
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('TuContraseña123!', 12);
console.log(hash);
"
```

2. En Supabase → SQL Editor, ejecuta:

```sql
INSERT INTO admin_users (email, password_hash, full_name)
VALUES (
  'admin@tudominio.cl',
  '$2a$12$EL_HASH_GENERADO_AQUI',
  'Administrador'
);
```

---

## 6. Ejecutar en desarrollo

```bash
npm run dev
```

Abre:
- **Vista cliente:** http://localhost:3000
- **Panel admin:** http://localhost:3000/admin
- **Login admin:** http://localhost:3000/admin/login

---

## 7. Deploy en Cloudflare Pages

### Paso 1: Build del proyecto

```bash
npm run build
```

### Paso 2: Instalar Wrangler CLI

```bash
npm install -g wrangler
wrangler login
```

### Paso 3: Crear el proyecto en Cloudflare

```bash
# Primera vez:
wrangler pages project create reservas-app

# Deploy:
wrangler pages deploy .next/standalone --project-name reservas-app
```

### Paso 4: Configurar variables de entorno en Cloudflare

1. Ve a [dash.cloudflare.com](https://dash.cloudflare.com)
2. Workers & Pages → tu proyecto → **Settings → Environment Variables**
3. Agrega cada variable de `.env.example` como **Production variable**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_APP_URL` (con tu dominio real)
4. Clic en **Save and deploy**

### Paso 5: Re-deploy para aplicar variables

```bash
wrangler pages deploy .next/standalone --project-name reservas-app
```

---

## 8. Conectar con GitHub

El método más fácil para deploys automáticos:

### Paso 1: Subir a GitHub

```bash
git init
git add .
git commit -m "feat: initial commit"

# Crea el repo en github.com, luego:
git remote add origin https://github.com/tuusuario/reservas-app.git
git push -u origin main
```

### Paso 2: Conectar en Cloudflare Pages

1. Cloudflare Dashboard → **Workers & Pages → Create application → Pages**
2. Clic en **Connect to Git**
3. Autoriza GitHub y selecciona tu repositorio
4. Configuración de build:
   - **Framework preset:** Next.js
   - **Build command:** `npm run build`
   - **Build output directory:** `.next/standalone`
5. Agrega las variables de entorno (igual que paso 4 anterior)
6. Clic en **Save and Deploy**

Desde ahora, cada `git push` a `main` hace deploy automático.

---

## 9. Dominio personalizado

### En Cloudflare Pages

1. Workers & Pages → tu proyecto → **Custom Domains**
2. Clic en **Set up a custom domain**
3. Ingresa tu dominio: `reservas.tudominio.cl`
4. Si tu dominio ya está en Cloudflare, se configura automáticamente
5. Si no, agrega el CNAME que te indica Cloudflare a tu DNS

### En Supabase

1. Supabase → Authentication → URL Configuration
2. Agrega tu dominio en **Site URL**: `https://reservas.tudominio.cl`

---

## 10. Cambiar contraseña admin

### Opción A — Script

```bash
# Edita scripts/seed-admin.ts con la nueva contraseña, luego:
ADMIN_DEFAULT_PASSWORD=NuevaContraseña123! npx tsx scripts/seed-admin.ts
```

### Opción B — SQL en Supabase

```bash
# 1. Genera el nuevo hash:
node -e "
const b = require('bcryptjs');
console.log(b.hashSync('NuevaContraseña123!', 12));
"

# 2. En SQL Editor de Supabase:
UPDATE admin_users
SET password_hash = '$2a$12$NUEVO_HASH'
WHERE email = 'admin@tudominio.cl';
```

---

## 11. Personalizar branding

### Nombre de la app

Edita `NEXT_PUBLIC_APP_NAME` en `.env.local` y en Cloudflare.

### Colores

Edita `tailwind.config.js`, sección `colors.brand`:

```js
brand: {
  50:  '#EEF4E8',  // fondo suave
  100: '#D4E8C0',
  500: '#4A7C28',  // color principal
  600: '#2D5016',  // botones
  700: '#1E3A0F',  // hover
}
```

### Logo / Nombre en nav

Edita el texto `ReservasPro` en:
- `app/page.tsx` (nav cliente)
- `app/admin/page.tsx` (nav admin)
- `app/admin/login/page.tsx` (login)
- `app/layout.tsx` (metadata)

### Horarios por defecto

En `components/BlockForm.tsx`, edita los valores iniciales del formulario:

```ts
const [form, setForm] = useState({
  date: today,
  startTime: '09:00',  // ← cambiar
  endTime: '18:00',    // ← cambiar
  duration: 60,        // ← cambiar (en minutos)
  capacity: 1,
})
```

---

## 12. Probar concurrencia

### Prueba manual (2 pestañas)

1. Crea un bloque con **1 cupo** desde el panel admin
2. Abre la vista cliente en 2 pestañas del navegador
3. En ambas, selecciona el mismo horario y llena el formulario
4. Haz clic en "Confirmar" en ambas casi al mismo tiempo
5. **Resultado esperado:** una muestra confirmación, la otra muestra el error de disponibilidad

### Prueba con script Node.js

```js
// test-concurrency.js
const BLOCK_ID = 'uuid-del-bloque-con-1-cupo'
const BASE_URL = 'http://localhost:3000'

const makeBooking = (n) => fetch(`${BASE_URL}/api/bookings`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    availability_block_id: BLOCK_ID,
    customer_first_name: `Test${n}`,
    customer_last_name: 'User',
    customer_email: `test${n}@test.com`,
    customer_phone: '912345678',
  }),
}).then(r => r.json())

// Lanzar 5 reservas simultáneas
Promise.all([1,2,3,4,5].map(makeBooking)).then(results => {
  const ok = results.filter(r => r.success).length
  const err = results.filter(r => !r.success).length
  console.log(`✅ Confirmadas: ${ok}  ❌ Rechazadas: ${err}`)
  // Esperado con 1 cupo: Confirmadas: 1  Rechazadas: 4
})
```

```bash
node test-concurrency.js
```

### Por qué funciona la protección

```sql
-- En PostgreSQL (ejecutado via supabase.rpc):
BEGIN;

  -- 1. Bloquea la fila — ningún otro proceso puede leerla hasta COMMIT
  SELECT * FROM availability_blocks WHERE id = $1 FOR UPDATE;

  -- 2. Valida remaining_capacity > 0
  -- (si otro proceso decrementó el cupo entre tanto, aquí lo detectamos)

  -- 3. INSERT booking

  -- 4. UPDATE remaining_capacity - 1

COMMIT; -- libera el lock
```

Si 10 usuarios intentan reservar el mismo bloque con 1 cupo simultáneamente:
- PostgreSQL serializa los `FOR UPDATE` → solo uno procede
- Los 9 restantes esperan el lock y luego leen `remaining_capacity = 0`
- Todos reciben el mensaje correcto de error

---

## 13. Estructura del proyecto

```
reservas-app/
├── app/
│   ├── page.tsx                    Vista cliente (calendario + reserva)
│   ├── layout.tsx                  Layout raíz con fuentes
│   ├── globals.css                 Estilos globales Tailwind
│   ├── admin/
│   │   ├── page.tsx                Panel admin principal
│   │   ├── login/page.tsx          Login administrador
│   │   └── bookings/page.tsx       Página de reservas
│   └── api/
│       ├── availability/route.ts   GET disponibilidad pública
│       ├── bookings/route.ts       POST crear reserva / GET listar
│       ├── bookings/[id]/route.ts  PATCH cancelar reserva
│       ├── blocks/route.ts         POST crear bloques / GET listar
│       ├── blocks/[id]/route.ts    PATCH actualizar / DELETE eliminar
│       └── auth/login/route.ts     POST login / DELETE logout
├── components/
│   ├── ui/                         Componentes base reutilizables
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Alert.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Toggle.tsx
│   │   └── Spinner.tsx
│   ├── Calendar.tsx                Calendario interactivo
│   ├── TimeSlots.tsx               Grilla de horarios disponibles
│   ├── BookingForm.tsx             Formulario de reserva del cliente
│   ├── BlockForm.tsx               Formulario admin crear horarios
│   └── BookingsTable.tsx           Tabla de reservas con filtros
├── services/
│   ├── blockGenerator.ts           Genera bloques de tiempo
│   ├── bookingTransactionService.ts Transacción atómica anti doble reserva
│   ├── availabilityService.ts      Consultas de disponibilidad
│   ├── blockService.ts             CRUD de bloques
│   ├── bookingService.ts           Consultas de reservas
│   └── authService.ts              Login y gestión de admins
├── hooks/
│   ├── useAvailability.ts          Estado de disponibilidad cliente
│   └── useBookings.ts              Estado de reservas admin
├── types/
│   ├── block.ts                    Tipos TypeScript para bloques
│   ├── booking.ts                  Tipos para reservas
│   └── availability.ts             Tipos generales y auth
├── lib/
│   ├── supabase.ts                 Clientes Supabase (public + admin)
│   ├── auth.ts                     JWT signing/verification
│   ├── timezone.ts                 Utilidades America/Santiago
│   └── utils.ts                    cn(), validadores, helpers
├── supabase/
│   └── migrations/
│       └── 001_initial.sql         SQL completo con funciones atómicas
├── scripts/
│   └── seed-admin.ts               Crear primer administrador
├── middleware.ts                   Protección rutas /admin/*
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── wrangler.toml
└── .env.example
```

---

## 14. API Reference

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `GET` | `/api/availability` | Público | Fechas con disponibilidad |
| `GET` | `/api/availability?date=YYYY-MM-DD` | Público | Bloques por fecha |
| `POST` | `/api/bookings` | Público | Crear reserva (atómica) |
| `GET` | `/api/bookings` | Admin | Listar reservas (con filtros) |
| `PATCH` | `/api/bookings/:id` | Admin | Cancelar reserva |
| `POST` | `/api/blocks` | Admin | Crear bloques en bulk |
| `GET` | `/api/blocks` | Admin | Listar todos los bloques |
| `PATCH` | `/api/blocks/:id` | Admin | Activar/desactivar bloque |
| `DELETE` | `/api/blocks/:id` | Admin | Eliminar bloque |
| `POST` | `/api/auth/login` | Público | Login admin → cookie JWT |
| `DELETE` | `/api/auth/login` | Admin | Logout → elimina cookie |

### Ejemplo: crear reserva

```bash
curl -X POST https://tu-app.pages.dev/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "availability_block_id": "uuid-del-bloque",
    "customer_first_name": "María",
    "customer_last_name": "González",
    "customer_email": "maria@email.com",
    "customer_phone": "+56912345678"
  }'
```

### Ejemplo: crear bloques (admin)

```bash
curl -X POST https://tu-app.pages.dev/api/blocks \
  -H "Content-Type: application/json" \
  -b "reservas_admin_session=TU_TOKEN" \
  -d '{
    "date": "2026-06-01",
    "start_time": "09:00",
    "end_time": "13:00",
    "duration_minutes": 30,
    "capacity": 1
  }'
```

---

## Extensiones futuras preparadas

La arquitectura soporta agregar sin cambios estructurales:

- **Google Calendar:** campo `google_calendar_id` en `recurrence_rules`
- **MercadoPago:** agregar `payment_status` y `payment_id` en `bookings`
- **WhatsApp / Email:** tabla `notifications` con cola de mensajes
- **Múltiples negocios:** tabla `businesses` → FK en todas las tablas
- **Múltiples profesionales:** tabla `professionals` → FK en bloques
- **Servicios distintos:** tabla `services` → duración y precio en bloques

---

## Soporte

Si tienes problemas con el deploy, verifica:

1. Las variables de entorno están todas configuradas en Cloudflare
2. La migración SQL se ejecutó correctamente (sin errores)
3. El admin se creó con el script o SQL
4. El `JWT_SECRET` es el mismo en todas las plataformas
