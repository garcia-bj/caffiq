import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"}/api`;

function getRedirectScheme(): string {
  const url = Linking.createURL("/");
  return url.split("://")[0] ?? "caffiq";
}

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

function parseRedirectUrl(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const idx = url.indexOf("?");
  if (idx === -1) return params;
  url.substring(idx + 1).split("&").forEach((pair) => {
    const eq = pair.indexOf("=");
    if (eq > 0) params[pair.substring(0, eq)] = decodeURIComponent(pair.substring(eq + 1));
  });
  return params;
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

  googleLogin: async (rol: "cliente" | "admin"): Promise<GoogleLoginResult> => {
    const scheme = getRedirectScheme();
    const redirectUrl = `${scheme}://auth/callback`;
    const result = await WebBrowser.openAuthSessionAsync(
      `${BASE_URL}/auth/google?rol=${rol}&platform=mobile&scheme=${encodeURIComponent(scheme)}`,
      redirectUrl,
    );
    if (result.type !== "success") {
      throw new Error("Inicio de sesion con Google cancelado");
    }
    const params = parseRedirectUrl(result.url);
    const token = params.token;
    const usuarioRaw = params.usuario;
    if (!token || !usuarioRaw) {
      throw new Error("No se recibieron los datos de autenticacion");
    }
    return {
      token,
      usuario: JSON.parse(usuarioRaw) as UsuarioPublico,
      necesita_telefono: params.necesita_telefono === "true",
    };
  },
};
