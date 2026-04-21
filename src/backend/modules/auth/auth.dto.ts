// ─── Tipos de entrada ────────────────────────────────────────────────────────

export type Rol = "cliente" | "admin";

// Datos opcionales de cafetería — solo cuando rol === "admin"
export interface CafeteriaDTO {
  nom_cafeteria:    string;
  direccion:        string;
  ciudad:           string;
  descripcion?:     string;
  horario_apertura?: string; // formato HH:MM
  horario_cierre?:   string; // formato HH:MM
}

export interface RegisterDTO {
  nom_usuario:  string; // debe ser un correo electrónico válido
  nom_completo: string;
  num_telefono: string; // formato: +521XXXXXXXXXX
  password:     string;
  rol:          Rol;
  cafeteria?:   CafeteriaDTO; // requerido cuando rol === "admin"
}

export interface LoginDTO {
  nom_usuario: string;
  password:    string;
}

// ─── Tipos de salida ─────────────────────────────────────────────────────────

export interface UsuarioPublico {
  id:                  string;
  nom_usuario:         string;
  nom_completo:        string;
  num_telefono:        string;
  rol:                 Rol;
  telefono_verificado: boolean;
  created_at:          string;
  cafeteria_id?:       string; // solo para admins
}

export interface AuthResponse {
  token:   string;
  usuario: UsuarioPublico;
}

// ─── Filas de tablas en Supabase ─────────────────────────────────────────────

export interface UsuarioRow {
  id:                  string;
  nom_usuario:         string;
  nom_completo:        string;
  num_telefono:        string;
  password:            string;
  rol:                 Rol;
  telefono_verificado: boolean;
  google_id?:          string;
  created_at:          string;
}

export interface CafeteriaRow {
  id:               string;
  admin_id:         string;
  nom_cafeteria:    string;
  direccion:        string;
  ciudad:           string;
  descripcion:      string | null;
  horario_apertura: string | null;
  horario_cierre:   string | null;
  activa:           boolean;
  created_at:       string;
}
