-- Agrega columna sucursal_id a personalizaciones para soportar personalización independiente por sucursal
ALTER TABLE personalizaciones
  ADD COLUMN IF NOT EXISTS sucursal_id UUID REFERENCES "Sucursal"(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_personalizaciones_sucursal_id
  ON personalizaciones(sucursal_id);
