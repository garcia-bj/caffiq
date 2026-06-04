-- ═══════════════════════════════════════════════════════════════
-- Migración 005: pedidos, personalizaciones, opciones_personalizacion
-- Ejecutar en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Tabla pedidos ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pedidos (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id      UUID        NOT NULL REFERENCES usuarios(id)   ON DELETE CASCADE,
  cafeteria_id    UUID        NOT NULL REFERENCES cafeterias(id) ON DELETE CASCADE,
  sucursal_id     UUID        NOT NULL,
  items           JSONB       NOT NULL DEFAULT '[]',
  total           NUMERIC(10,2) NOT NULL,
  estado          TEXT        NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente','aprobado','rechazado')),
  tipo_pedido     TEXT        NOT NULL DEFAULT 'llevar'
                    CHECK (tipo_pedido IN ('llevar','local')),
  comprobante_url TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_cafeteria ON pedidos(cafeteria_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente   ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado    ON pedidos(estado);

-- ── 2. Tabla personalizaciones ────────────────────────────────
CREATE TABLE IF NOT EXISTS personalizaciones (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  cafeteria_id UUID    NOT NULL REFERENCES cafeterias(id) ON DELETE CASCADE,
  nombre       TEXT    NOT NULL,
  requerido    BOOLEAN NOT NULL DEFAULT FALSE,
  orden        INT     NOT NULL DEFAULT 0,
  activo       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personalizaciones_cafeteria ON personalizaciones(cafeteria_id);

-- ── 3. Tabla opciones_personalizacion ─────────────────────────
CREATE TABLE IF NOT EXISTS opciones_personalizacion (
  id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  personalizacion_id  UUID    NOT NULL REFERENCES personalizaciones(id) ON DELETE CASCADE,
  nombre              TEXT    NOT NULL,
  precio_adicional    NUMERIC(8,2) NOT NULL DEFAULT 0,
  orden               INT     NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_opciones_personalizacion ON opciones_personalizacion(personalizacion_id);

-- ── 4. RLS básico ─────────────────────────────────────────────
ALTER TABLE pedidos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalizaciones     ENABLE ROW LEVEL SECURITY;
ALTER TABLE opciones_personalizacion ENABLE ROW LEVEL SECURITY;

-- Política: service_role puede hacer todo (backend usa service key)
CREATE POLICY "service_role_all_pedidos"
  ON pedidos FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_personalizaciones"
  ON personalizaciones FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_opciones"
  ON opciones_personalizacion FOR ALL TO service_role USING (true) WITH CHECK (true);
