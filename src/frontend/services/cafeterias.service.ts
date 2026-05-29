const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"}/api`;

export interface CafeteriaPublica {
  id:          string;
  nom_cafeteria: string;
  ciudad:      string;
  descripcion: string | null;
  activa:      boolean;
  created_at:  string;
}

export interface CafeteriaDetalle extends CafeteriaPublica {
  admin_id:        string;
  horario_apertura: string | null;
  horario_cierre:   string | null;
  logo_url:        string | null;
  banner_url:      string | null;
  qr_pago_url:     string | null;
}

export interface CafeteriaUpdateInput {
  descripcion?:     string | null;
  horario_apertura?: string | null;
  horario_cierre?:   string | null;
  logo_url?:        string | null;
  banner_url?:      string | null;
  qr_pago_url?:     string | null;
}

export interface SucursalPublica {
  id:               string;
  cafeteria_id:     string;
  nombre:           string;
  direccion:        string;
  ciudad:           string;
  horario_apertura: string | null;
  horario_cierre:   string | null;
  imagen_url:       string | null;
  latitud:          number | null;
  longitud:         number | null;
  activa:           boolean;
  created_at:       string;
}

const api = async <T>(path: string, token: string, options: RequestInit = {}): Promise<T> => {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.mensaje ?? "Error desconocido");
  return json as T;
};

export const cafeteriasService = {
  listar: (token: string) =>
    api<{ cafeterias: CafeteriaPublica[] }>("/cafeterias", token),

  obtener: (token: string, cafeteria_id: string) =>
    api<{ cafeteria: CafeteriaDetalle }>(`/cafeterias/${cafeteria_id}`, token),

  actualizar: (token: string, cafeteria_id: string, datos: CafeteriaUpdateInput) =>
    api<{ cafeteria: CafeteriaDetalle }>(`/cafeterias/${cafeteria_id}`, token, {
      method: "PATCH",
      body: JSON.stringify(datos),
    }),

  sucursales: (token: string, cafeteria_id: string) =>
    api<{ sucursales: SucursalPublica[] }>(`/cafeterias/${cafeteria_id}/sucursales`, token),
};
