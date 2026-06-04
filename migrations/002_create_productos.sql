-- Tabla de productos por cafeteria
CREATE TABLE IF NOT EXISTS productos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafeteria_id  UUID NOT NULL REFERENCES cafeterias(id) ON DELETE CASCADE,
  nombre        TEXT NOT NULL,
  descripcion   TEXT,
  precio        DECIMAL(10,2) NOT NULL,
  categoria     TEXT NOT NULL DEFAULT 'Todos',
  imagen_url    TEXT,
  badge         TEXT,        -- 'Popular' | 'Nuevo' | 'Fresco' | null
  disponible    BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_productos_cafeteria_id ON productos(cafeteria_id);
