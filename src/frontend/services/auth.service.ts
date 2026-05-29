import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "@/frontend/lib/supabase";

import { API_BASE } from "@/frontend/lib/apiUrl";
const BASE_URL = `${API_BASE}/api`;

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

interface GoogleLoginResult extends AuthResponse {
  necesita_telefono: boolean;
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
  nom_cafeteria: string;
  ciudad:        string;
  descripcion?:  string;
  logo_uri?:     string;
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

  updateMe: (token: string, datos: { nom_completo?: string; num_telefono?: string }) =>
    api<{ usuario: UsuarioPublico }>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(datos),
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Flujo OAuth directo — el rol viaja en el deep link para que callback lo lea
  googleLogin: async (rol: Rol): Promise<void> => {
    const redirectTo = Linking.createURL("/auth/callback", { queryParams: { rol } });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data.url) throw new Error("Error generando URL de autenticacion con Google");
    await WebBrowser.openBrowserAsync(data.url);
  },

  setupCafeteria: (token: string, datos: { nom_cafeteria: string; ciudad: string; descripcion?: string }) =>
    api<AuthResponse>("/auth/setup-cafeteria", {
      method:  "POST",
      body:    JSON.stringify(datos),
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Llamado desde app/auth/callback.tsx con el token de Supabase
  exchangeGoogleToken: (access_token: string, rol: Rol) =>
    api<GoogleLoginResult>("/auth/google/token", {
      method: "POST",
      body: JSON.stringify({ access_token, rol }),
    }),
};
