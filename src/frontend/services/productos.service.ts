import { API_BASE } from "@/frontend/lib/apiUrl";
const BASE_URL = `${API_BASE}/api`;

export interface ProductoPublico {
  id: string;
  cafeteria_id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoria: string;
  imagen_url: string | null;
  badge: string | null;
  disponible: boolean;
  stock: number | null;
  created_at: string;
}

export interface ProductoInput {
  id_sucursal: string;
  nom_producto: string;
  descripcion?: string;
  precio: number | string;
  stock?: number | string;
  imagen_producto?: string;
}

export interface ProductoEditInput {
  nom_producto?: string;
  descripcion?: string;
  precio?: number | string;
  stock?: number | string;
  imagen_producto?: string;
  estado?: boolean;
}

const authFetch = async <T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> => {
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

export const productosService = {
  listar: (token: string, cafeteria_id: string, categoria?: string) => {
    const qs = categoria && categoria !== "Todos" ? `?categoria=${encodeURIComponent(categoria)}` : "";
    return authFetch<{ productos: ProductoPublico[] }>(`/cafeterias/${cafeteria_id}/productos${qs}`, token);
  },

  listarPorSucursal: (token: string, cafeteria_id: string, sucursal_id: string) =>
    authFetch<{ productos: ProductoPublico[] }>(
      `/cafeterias/${cafeteria_id}/productos?sucursal_id=${encodeURIComponent(sucursal_id)}&todos=true`,
      token,
    ),

  obtener: (token: string, cafeteria_id: string, producto_id: string) =>
    authFetch<{ producto: ProductoPublico }>(
      `/cafeterias/${cafeteria_id}/productos/${producto_id}`,
      token,
    ),

  crear: (token: string, cafeteria_id: string, datos: ProductoInput) =>
    authFetch<{ producto: ProductoPublico }>(
      `/cafeterias/${cafeteria_id}/productos`,
      token,
      { method: "POST", body: JSON.stringify(datos) },
    ),

  modificar: (token: string, cafeteria_id: string, producto_id: string, datos: ProductoEditInput) =>
    authFetch<{ producto: ProductoPublico }>(
      `/cafeterias/${cafeteria_id}/productos/${producto_id}`,
      token,
      { method: "PUT", body: JSON.stringify(datos) },
    ),

  suspender: (token: string, cafeteria_id: string, producto_id: string) =>
    authFetch<{ mensaje: string }>(
      `/cafeterias/${cafeteria_id}/productos/${producto_id}/suspender`,
      token,
      { method: "PATCH" },
    ),
};
