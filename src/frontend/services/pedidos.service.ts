const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"}/api`;

export type EstadoPedido = "pendiente" | "aprobado" | "rechazado";
export type TipoPedido   = "llevar" | "local";

export interface PedidoItem {
  producto_id: string;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  personalizaciones: Array<{ nombre: string; opcion: string; precio_adicional: number }>;
  tipo_pedido?: TipoPedido;
}

export interface Pedido {
  id: string;
  cliente_id: string;
  cafeteria_id: string;
  sucursal_id: string;
  items: PedidoItem[];
  total: number;
  estado: EstadoPedido;
  tipo_pedido: TipoPedido;
  comprobante_url: string | null;
  created_at: string;
  cliente?: { nom_completo: string; nom_usuario: string };
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

export const pedidosService = {
  crear: (token: string, datos: {
    cafeteria_id: string;
    sucursal_id: string;
    items: PedidoItem[];
    total: number;
    tipo_pedido: TipoPedido;
    comprobante_url?: string;
  }) =>
    authFetch<{ pedido: Pedido }>("/pedidos", token, {
      method: "POST",
      body: JSON.stringify(datos),
    }),

  misPedidos: (token: string) =>
    authFetch<{ pedidos: Pedido[] }>("/pedidos/mis-pedidos", token),

  listarPorCafeteria: (token: string, cafeteria_id: string, estado?: EstadoPedido) => {
    const qs = estado ? `?estado=${estado}` : "";
    return authFetch<{ pedidos: Pedido[] }>(`/cafeterias/${cafeteria_id}/pedidos${qs}`, token);
  },

  actualizarEstado: (token: string, pedido_id: string, cafeteria_id: string, estado: "aprobado" | "rechazado") =>
    authFetch<{ pedido: Pedido }>(`/pedidos/${pedido_id}/estado`, token, {
      method: "PATCH",
      body: JSON.stringify({ estado, cafeteria_id }),
    }),
};
