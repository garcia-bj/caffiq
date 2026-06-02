-- Agrega columna hora_recogida a la tabla pedidos
-- Solo aplica para pedidos de tipo "llevar"
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS hora_recogida TEXT;
