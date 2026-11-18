-- ====================================================================
-- Baby Spa Paraguay - Esquema de Base de Datos para Supabase o Neon
-- Compatible con PostgreSQL 14+, Neon Serverless y Supabase
-- ====================================================================

-- 1. Crear tabla de reservas
CREATE TABLE IF NOT EXISTS reservas (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE NOT NULL,
    servicio VARCHAR(50) NOT NULL,
    servicio_nombre VARCHAR(120) NOT NULL,
    fecha DATE NOT NULL,
    hora VARCHAR(10) NOT NULL,
    bebe_nombre VARCHAR(100) NOT NULL,
    bebe_edad INTEGER NOT NULL,
    tutor_nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(30) NOT NULL,
    notas TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'confirmada' CHECK (estado IN ('confirmada', 'completada', 'cancelada')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Índice único parcial: Previene Overbooking (sobre-reserva) a nivel de base de datos
-- Garantiza que NUNCA puedan existir dos reservas activas para la misma fecha y hora.
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_booking 
ON reservas (fecha, hora) 
WHERE estado != 'cancelada';

-- 3. Índices de rendimiento para consultas frecuentes por fecha y código
CREATE INDEX IF NOT EXISTS idx_reservas_fecha ON reservas(fecha);
CREATE INDEX IF NOT EXISTS idx_reservas_codigo ON reservas(codigo);
CREATE INDEX IF NOT EXISTS idx_reservas_estado ON reservas(estado);

-- 4. Configuración pública del negocio y plantilla de confirmación por WhatsApp
CREATE TABLE IF NOT EXISTS public.business_settings (
    id SMALLINT PRIMARY KEY CHECK (id = 1),
    business_name VARCHAR(100) NOT NULL DEFAULT 'Baby Spa Paraguay',
    address VARCHAR(250) NOT NULL DEFAULT 'Barrio Herrera / Villa Morra, Asunción, Paraguay',
    google_maps_url VARCHAR(1000) NOT NULL DEFAULT '',
    whatsapp VARCHAR(15) NOT NULL DEFAULT '595981123456',
    instagram VARCHAR(30) NOT NULL DEFAULT 'babyspaparaguay',
    booking_message TEXT NOT NULL DEFAULT $message$¡Hola! Acabo de reservar un turno en [negocio]:
Código: [codigo]
Bebé: [nombre] ([edad])
Servicio: [servicio] ([minutos] minutos)
Fecha: [fecha] a las [hora] hs. Mamá/Papá: [tutor]$message$,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.business_settings
ADD COLUMN IF NOT EXISTS google_maps_url VARCHAR(1000) NOT NULL DEFAULT '';

INSERT INTO public.business_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

UPDATE public.business_settings
SET booking_message = $message$¡Hola! Acabo de reservar un turno en [negocio]:
Código: [codigo]
Bebé: [nombre] ([edad])
Servicio: [servicio] ([minutos] minutos)
Fecha: [fecha] a las [hora] hs. Mamá/Papá: [tutor]$message$,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 1
  AND booking_message = $legacy$¡Hola! Acabo de reservar un turno en {negocio}:
Código: {codigo}
Bebé: {bebe} ({edad})
Servicio: {servicio}
Fecha: {fecha} a las {hora} hs.
Mamá/Papá: {tutor}$legacy$;

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 5. Políticas de Seguridad RLS (Específico para Supabase)
-- En Neon esto no afecta, pero en Supabase activa el acceso seguro vía API REST
-- ====================================================================
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

-- Permitir consultar reservas para verificar disponibilidad de horarios
DROP POLICY IF EXISTS "Permitir lectura publica de disponibilidad" ON reservas;
CREATE POLICY "Permitir lectura publica de disponibilidad"
ON reservas FOR SELECT
USING (true);

-- Permitir que las familias envíen su reserva desde la web
DROP POLICY IF EXISTS "Permitir crear reservas desde la landing" ON reservas;
CREATE POLICY "Permitir crear reservas desde la landing"
ON reservas FOR INSERT
WITH CHECK (true);

-- Permitir actualizar estado de reserva (ej. cancelar o completar)
DROP POLICY IF EXISTS "Permitir actualizar reservas" ON reservas;
CREATE POLICY "Permitir actualizar reservas"
ON reservas FOR UPDATE
USING (true);

-- ====================================================================
-- 6. Datos de prueba iniciales (opcional)
-- Descomentar si deseas tener turnos ya ocupados de prueba para hoy/mañana:
-- ====================================================================
-- INSERT INTO reservas (codigo, servicio, servicio_nombre, fecha, hora, bebe_nombre, bebe_edad, tutor_nombre, telefono, notas, estado)
-- VALUES 
-- ('BSP-2026-TEST1', 'hidroterapia', 'Hidroterapia Infantil (30 min)', CURRENT_DATE, '09:15', 'Mateo', 6, 'Laura Gómez', '0981123456', 'Traer toalla personal', 'confirmada'),
-- ('BSP-2026-TEST2', 'masaje', 'Masaje Infantil & Relajación (35 min)', CURRENT_DATE, '14:45', 'Valentina', 4, 'Carlos Benítez', '0982654321', 'Primera experiencia acuática', 'confirmada');
