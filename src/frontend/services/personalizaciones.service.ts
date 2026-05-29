const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"}/api`;

export interface OpcionPersonalizacion {
  id: string;
  personalizacion_id: string;
  nombre: string;
  precio_adicional: number;
  orden: number;
}

export interface Personalizacion {
  id: string;
  cafeteria_id: string;
  nombre: string;
  requerido: boolean;
  orden: number;
  activo: boolean;
  created_at: string;
  opciones: OpcionPersonalizacion[];
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

export const personalizacionesService = {
  listar: (token: string, cafeteria_id: string) =>
    authFetch<{ personalizaciones: Personalizacion[] }>(
      `/cafeterias/${cafeteria_id}/personalizaciones`, token,
    ),

  crear: (token: string, cafeteria_id: string, nombre: string, requerido: boolean) =>
    authFetch<{ personalizacion: Personalizacion }>(
      `/cafeterias/${cafeteria_id}/personalizaciones`, token,
      { method: "POST", body: JSON.stringify({ nombre, requerido }) },
    ),

  actualizar: (token: string, cafeteria_id: string, id: string, datos: { nombre?: string; requerido?: boolean }) =>
    authFetch<{ personalizacion: Personalizacion }>(
      `/cafeterias/${cafeteria_id}/personalizaciones/${id}`, token,
      { method: "PUT", body: JSON.stringify(datos) },
    ),

  eliminar: (token: string, cafeteria_id: string, id: string) =>
    authFetch<{ mensaje: string }>(
      `/cafeterias/${cafeteria_id}/personalizaciones/${id}`, token,
      { method: "DELETE" },
    ),

  crearOpcion: (token: string, cafeteria_id: string, personalizacion_id: string, nombre: string, precio_adicional: number) =>
    authFetch<{ opcion: OpcionPersonalizacion }>(
      `/cafeterias/${cafeteria_id}/personalizaciones/${personalizacion_id}/opciones`, token,
      { method: "POST", body: JSON.stringify({ nombre, precio_adicional }) },
    ),

  actualizarOpcion: (token: string, cafeteria_id: string, personalizacion_id: string, opcion_id: string, datos: { nombre?: string; precio_adicional?: number }) =>
    authFetch<{ opcion: OpcionPersonalizacion }>(
      `/cafeterias/${cafeteria_id}/personalizaciones/${personalizacion_id}/opciones/${opcion_id}`, token,
      { method: "PUT", body: JSON.stringify(datos) },
    ),

  eliminarOpcion: (token: string, cafeteria_id: string, personalizacion_id: string, opcion_id: string) =>
    authFetch<{ mensaje: string }>(
      `/cafeterias/${cafeteria_id}/personalizaciones/${personalizacion_id}/opciones/${opcion_id}`, token,
      { method: "DELETE" },
    ),
};
