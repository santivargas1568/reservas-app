-- ================================================================
-- ReservasPro — Migración inicial
-- Ejecutar en: Supabase > SQL Editor
-- Timezone: America/Santiago
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================================
-- TABLA: admin_users
-- Administradores del sistema con contraseña hasheada
-- ================================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(150) NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ================================================================
-- TABLA: availability_blocks
-- ================================================================
CREATE TABLE IF NOT EXISTS availability_blocks (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  date               DATE        NOT NULL,
  start_time         TIME        NOT NULL,
  end_time           TIME        NOT NULL,
  duration_minutes   INT         NOT NULL CHECK (duration_minutes IN (15, 30, 45, 60, 90, 120)),
  capacity           INT         NOT NULL DEFAULT 1 CHECK (capacity >= 1 AND capacity <= 100),
  remaining_capacity INT         NOT NULL DEFAULT 1,
  is_active          BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_times    CHECK (end_time > start_time),
  CONSTRAINT check_capacity CHECK (remaining_capacity >= 0 AND remaining_capacity <= capacity)
);

CREATE INDEX idx_blocks_date        ON availability_blocks (date);
CREATE INDEX idx_blocks_available   ON availability_blocks (date, is_active, remaining_capacity)
  WHERE is_active = TRUE AND remaining_capacity > 0;

-- ================================================================
-- TABLA: bookings
-- ================================================================
CREATE TABLE IF NOT EXISTS bookings (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  availability_block_id UUID        NOT NULL REFERENCES availability_blocks(id) ON DELETE RESTRICT,
  customer_first_name   VARCHAR(80) NOT NULL CHECK (LENGTH(TRIM(customer_first_name)) >= 1),
  customer_last_name    VARCHAR(80) NOT NULL CHECK (LENGTH(TRIM(customer_last_name)) >= 1),
  customer_email        VARCHAR(255) NOT NULL CHECK (customer_email LIKE '%@%'),
  customer_phone        VARCHAR(30) NOT NULL CHECK (LENGTH(TRIM(customer_phone)) >= 6),
  customer_comment      TEXT        DEFAULT '',
  status                VARCHAR(20) NOT NULL DEFAULT 'confirmed'
                          CHECK (status IN ('confirmed', 'pending', 'cancelled')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_block_id ON bookings (availability_block_id);
CREATE INDEX idx_bookings_status   ON bookings (status);
CREATE INDEX idx_bookings_email    ON bookings (customer_email);

-- ================================================================
-- TABLA: recurrence_rules (para disponibilidad recurrente futura)
-- ================================================================
CREATE TABLE IF NOT EXISTS recurrence_rules (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(100) NOT NULL,
  day_of_week      INT[]   NOT NULL,
  start_time       TIME    NOT NULL,
  end_time         TIME    NOT NULL,
  duration_minutes INT     NOT NULL CHECK (duration_minutes IN (15, 30, 45, 60, 90, 120)),
  capacity         INT     NOT NULL DEFAULT 1,
  valid_from       DATE    NOT NULL,
  valid_until      DATE,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  google_calendar_id VARCHAR(255) DEFAULT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- TRIGGER: updated_at automático
-- ================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_blocks_updated
  BEFORE UPDATE ON availability_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_bookings_updated
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================================
-- FUNCIÓN: create_booking — TRANSACCIÓN ATÓMICA ANTI DOBLE RESERVA
--
-- Usa SELECT FOR UPDATE para bloquear la fila del bloque.
-- Solo una transacción puede proceder a la vez por bloque.
-- Si dos requests simultáneos llegan:
--   A: adquiere lock → valida cupo → crea reserva → decrementa → COMMIT → libera lock
--   B: espera lock → lee remaining_capacity = 0 → retorna error
-- ================================================================
CREATE OR REPLACE FUNCTION create_booking(
  p_block_id   UUID,
  p_first_name VARCHAR,
  p_last_name  VARCHAR,
  p_email      VARCHAR,
  p_phone      VARCHAR,
  p_comment    TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_block   availability_blocks%ROWTYPE;
  v_booking bookings%ROWTYPE;
BEGIN
  -- 1. SELECT FOR UPDATE: bloquea la fila hasta COMMIT o ROLLBACK
  SELECT * INTO v_block
  FROM availability_blocks
  WHERE id = p_block_id
  FOR UPDATE;

  -- 2. Validar existencia
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Bloque no encontrado');
  END IF;

  -- 3. Validar activo
  IF NOT v_block.is_active THEN
    RETURN json_build_object('success', false, 'error', 'Este horario ya no está disponible');
  END IF;

  -- 4. Validar que no sea pasado (America/Santiago)
  IF (v_block.date::TIMESTAMP + v_block.start_time)
     AT TIME ZONE 'America/Santiago' < NOW() AT TIME ZONE 'America/Santiago' THEN
    RETURN json_build_object('success', false, 'error', 'No puedes reservar un horario que ya pasó');
  END IF;

  -- 5. Validar cupos disponibles
  IF v_block.remaining_capacity <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Lo sentimos, este horario acaba de ser reservado. Por favor selecciona otro horario.'
    );
  END IF;

  -- 6. Crear reserva
  INSERT INTO bookings (
    availability_block_id, customer_first_name, customer_last_name,
    customer_email, customer_phone, customer_comment, status
  ) VALUES (
    p_block_id, TRIM(p_first_name), TRIM(p_last_name),
    LOWER(TRIM(p_email)), TRIM(p_phone), COALESCE(TRIM(p_comment), ''), 'confirmed'
  )
  RETURNING * INTO v_booking;

  -- 7. Descontar cupo
  UPDATE availability_blocks
  SET remaining_capacity = remaining_capacity - 1
  WHERE id = p_block_id;

  -- 8. COMMIT implícito al retornar exitosamente
  RETURN json_build_object('success', true, 'booking', row_to_json(v_booking));

EXCEPTION WHEN OTHERS THEN
  -- ROLLBACK implícito en caso de cualquier error
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ================================================================
-- FUNCIÓN: cancel_booking
-- ================================================================
CREATE OR REPLACE FUNCTION cancel_booking(p_booking_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_booking bookings%ROWTYPE;
BEGIN
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Reserva no encontrada');
  END IF;

  IF v_booking.status = 'cancelled' THEN
    RETURN json_build_object('success', false, 'error', 'Esta reserva ya fue cancelada');
  END IF;

  UPDATE bookings SET status = 'cancelled' WHERE id = p_booking_id;

  UPDATE availability_blocks
  SET remaining_capacity = LEAST(remaining_capacity + 1, capacity)
  WHERE id = v_booking.availability_block_id;

  RETURN json_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================
ALTER TABLE availability_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Clientes pueden ver bloques activos con cupos futuros
CREATE POLICY "public_read_available_blocks"
ON availability_blocks FOR SELECT TO anon
USING (
  is_active = TRUE
  AND remaining_capacity > 0
  AND (date::TIMESTAMP + start_time) AT TIME ZONE 'America/Santiago'
    > NOW() AT TIME ZONE 'America/Santiago'
);

-- El service role bypasea RLS (usado desde el servidor Next.js)
-- No se necesita policy adicional para service role

-- Función RPC accesible para anon
GRANT EXECUTE ON FUNCTION create_booking TO anon;
GRANT EXECUTE ON FUNCTION cancel_booking TO service_role;

-- ================================================================
-- SEED: Crear admin inicial
-- Reemplaza el hash por uno generado con bcrypt (cost 12)
-- En Node.js: require('bcryptjs').hashSync('TuContraseña', 12)
-- ================================================================
-- INSERT INTO admin_users (email, password_hash, full_name) VALUES (
--   'admin@tudominio.cl',
--   '$2a$12$HASH_AQUI',
--   'Administrador'
-- );

-- ================================================================
-- DATOS DE PRUEBA (descomenta para testing)
-- ================================================================
/*
INSERT INTO availability_blocks (date, start_time, end_time, duration_minutes, capacity, remaining_capacity)
SELECT
  (CURRENT_DATE + 1) AS date,
  (TIME '09:00' + (n || ' minutes')::INTERVAL)::TIME AS start_time,
  (TIME '09:30' + (n || ' minutes')::INTERVAL)::TIME AS end_time,
  30, 2, 2
FROM generate_series(0, 210, 30) n;
*/
