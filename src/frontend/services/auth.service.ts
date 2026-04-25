const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api";

type Rol = "cliente" | "admin";

export interface UsuarioPublico {
  id: string;
  nom_usuario: string;
  nom_completo: string;
  num_telefono: string;
  rol: Rol;
  telefono_verificado: boolean;
  created_at: string;
  cafeteria_id?: string;
}

interface AuthResponse {
  token: string;
  usuario: UsuarioPublico;
}

// ─── Helper para fetch con JSON ───────────────────────────────────────────────
const api = async <T>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.mensaje ?? "Error desconocido");
  return json as T;
};

// ─── Endpoints ────────────────────────────────────────────────────────────────

interface CafeteriaDTO {
  nom_cafeteria:     string;
  direccion:         string;
  ciudad:            string;
  descripcion?:      string;
  horario_apertura?: string;
  horario_cierre?:   string;
}

export const authService = {
  register: (datos: {
    nom_usuario:  string;
    nom_completo: string;
    num_telefono: string;
    password:     string;
    rol:          Rol;
    cafeteria?:   CafeteriaDTO;
  }) =>
    api<{ mensaje: string; usuario_id: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(datos),
    }),

  verifyPhone: (usuario_id: string, codigo: string) =>
    api<AuthResponse>("/auth/verify-phone", {
      method: "POST",
      body: JSON.stringify({ usuario_id, codigo }),
    }),

  resendOtp: (usuario_id: string) =>
    api<{ mensaje: string }>("/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify({ usuario_id }),
    }),

  login: (nom_usuario: string, password: string) =>
    api<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ nom_usuario, password }),
    }),

  me: (token: string) =>
    api<{ usuario: UsuarioPublico }>("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
