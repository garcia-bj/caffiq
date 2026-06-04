-- ═══════════════════════════════════════════════════════════════
-- Fix: agregar columna tipo_pedido si no existe
-- Ejecutar en Supabase SQL Editor, luego recargar schema cache:
--   Dashboard → Settings → API → "Reload schema cache"
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS tipo_pedido TEXT NOT NULL DEFAULT 'llevar'
    CHECK (tipo_pedido IN ('llevar', 'local'));

-- Verificar que se agregó correctamente
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'pedidos' AND column_name = 'tipo_pedido';
