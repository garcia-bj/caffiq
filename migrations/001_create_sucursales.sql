-- Tabla de sucursales: cada fila es una ubicación física de una cafetería
CREATE TABLE IF NOT EXISTS sucursales (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  cafeteria_id     UUID          NOT NULL REFERENCES cafeterias(id) ON DELETE CASCADE,
  nombre           TEXT          NOT NULL,
  direccion        TEXT          NOT NULL,
  ciudad           TEXT          NOT NULL,
  horario_apertura TEXT,                          -- formato HH:MM (ej. "07:00")
  horario_cierre   TEXT,                          -- formato HH:MM (ej. "21:00")
  imagen_url       TEXT,                          -- URL pública desde Supabase Storage
  latitud          DECIMAL(10,8),
  longitud         DECIMAL(11,8),
  activa           BOOLEAN       DEFAULT true,
  created_at       TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sucursales_cafeteria_id ON sucursales(cafeteria_id);

-- ─── Supabase Storage ─────────────────────────────────────────────────────────
-- Crear el bucket "sucursales" en Storage > New bucket
--   Name: sucursales
--   Public bucket: true   (para acceso directo via URL pública)
-- La URL de cada imagen quedará como:
--   https://<proyecto>.supabase.co/storage/v1/object/public/sucursales/<archivo>
