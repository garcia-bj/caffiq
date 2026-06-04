-- Agregar soporte para Google OAuth en la tabla usuarios
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_usuarios_google_id ON usuarios(google_id);
