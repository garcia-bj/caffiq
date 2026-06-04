-- ═══════════════════════════════════════════════════════════════════════════
-- Migración 003: Unificar tabla sucursales → Sucursal
-- Pasos:
--   1. Renombrar columnas de Sucursal para alinear con el esquema moderno
--   2. Agregar columnas faltantes a Sucursal
--   3. Migrar los datos de sucursales a Sucursal
--   4. Eliminar la tabla sucursales
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Paso 1: Renombrar columnas de la tabla Sucursal ─────────────────────────
ALTER TABLE "Sucursal" RENAME COLUMN id_sucursal     TO id;
ALTER TABLE "Sucursal" RENAME COLUMN imagen          TO imagen_url;
ALTER TABLE "Sucursal" RENAME COLUMN estado_sucursal TO activa;

-- ─── Paso 2: Ajustar default de activa (antes era nullable) ──────────────────
ALTER TABLE "Sucursal" ALTER COLUMN activa SET DEFAULT true;
UPDATE "Sucursal" SET activa = true WHERE activa IS NULL;

-- ─── Paso 3: Agregar columnas faltantes ──────────────────────────────────────
ALTER TABLE "Sucursal" ADD COLUMN IF NOT EXISTS cafeteria_id     UUID          REFERENCES cafeterias(id) ON DELETE CASCADE;
ALTER TABLE "Sucursal" ADD COLUMN IF NOT EXISTS ciudad           TEXT;
ALTER TABLE "Sucursal" ADD COLUMN IF NOT EXISTS horario_apertura TEXT;
ALTER TABLE "Sucursal" ADD COLUMN IF NOT EXISTS horario_cierre   TEXT;
ALTER TABLE "Sucursal" ADD COLUMN IF NOT EXISTS latitud          DECIMAL(10,8);
ALTER TABLE "Sucursal" ADD COLUMN IF NOT EXISTS longitud         DECIMAL(11,8);
ALTER TABLE "Sucursal" ADD COLUMN IF NOT EXISTS created_at       TIMESTAMPTZ   DEFAULT NOW();

-- Poner created_at en los registros existentes que lo tengan NULL
UPDATE "Sucursal" SET created_at = NOW() WHERE created_at IS NULL;

-- ─── Paso 4: Migrar datos de sucursales → Sucursal ───────────────────────────
-- Solo inserta filas de sucursales que no existan ya en Sucursal (por id)
INSERT INTO "Sucursal" (
  id, cafeteria_id, nombre, direccion, ciudad,
  horario_apertura, horario_cierre, imagen_url,
  latitud, longitud, activa, created_at
)
SELECT
  id, cafeteria_id, nombre, direccion, ciudad,
  horario_apertura, horario_cierre, imagen_url,
  latitud, longitud, activa, created_at
FROM sucursales
ON CONFLICT (id) DO NOTHING;

-- ─── Paso 5: Eliminar tabla sucursales ───────────────────────────────────────
DROP TABLE IF EXISTS sucursales;

-- ─── Paso 6: Índice para consultas por cafetería ─────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sucursal_cafeteria_id ON "Sucursal"(cafeteria_id);
