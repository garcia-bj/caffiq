const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api";

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
  created_at: string;
}

const authFetch = async <T>(path: string, token: string): Promise<T> => {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.mensaje ?? "Error en la solicitud");
  return json as T;
};

export const productosService = {
  listar: (token: string, cafeteria_id: string, categoria?: string) => {
    const qs = categoria && categoria !== "Todos" ? `?categoria=${encodeURIComponent(categoria)}` : "";
    return authFetch<{ productos: ProductoPublico[] }>(`/cafeterias/${cafeteria_id}/productos${qs}`, token);
  },
};
