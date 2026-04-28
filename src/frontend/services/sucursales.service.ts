const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"}/api`;

export interface SucursalPublica {
  id: string;
  cafeteria_id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  horario_apertura: string | null;
  horario_cierre: string | null;
  imagen_url: string | null;
  latitud: number | null;
  longitud: number | null;
  activa: boolean;
  created_at: string;
}

export interface SucursalInput {
  nombre: string;
  direccion: string;
  ciudad: string;
  horario_apertura?: string;
  horario_cierre?: string;
  imagen_url?: string;
}

const authFetch = async <T>(path: string, token: string, options: RequestInit = {}): Promise<T> => {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.mensaje ?? json.error ?? "Error en la solicitud");
  return json as T;
};

export const sucursalesService = {
  listar: (token: string, cafeteria_id: string) =>
    authFetch<{ sucursales: SucursalPublica[] }>(`/cafeterias/${cafeteria_id}/sucursales`, token),

  crear: (token: string, cafeteria_id: string, datos: SucursalInput) =>
    authFetch<{ sucursal: SucursalPublica }>(`/cafeterias/${cafeteria_id}/sucursales`, token, {
      method: "POST",
      body: JSON.stringify(datos),
    }),

  modificar: (token: string, cafeteria_id: string, sucursal_id: string, datos: Partial<SucursalInput>) =>
    authFetch<{ sucursal: SucursalPublica }>(`/cafeterias/${cafeteria_id}/sucursales/${sucursal_id}`, token, {
      method: "PUT",
      body: JSON.stringify(datos),
    }),

  suspender: (token: string, cafeteria_id: string, sucursal_id: string) =>
    authFetch<{ mensaje: string }>(`/cafeterias/${cafeteria_id}/sucursales/${sucursal_id}/suspender`, token, {
      method: "PATCH",
    }),
};
