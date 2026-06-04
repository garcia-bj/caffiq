export type EstadoPedido = "pendiente" | "aprobado" | "rechazado";
export type TipoPedido   = "llevar" | "local";

export interface PedidoItem {
  producto_id: string;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  personalizaciones: Array<{
    nombre: string;
    opcion: string;
    precio_adicional: number;
  }>;
}

export interface PedidoEntity {
  id: string;
  cliente_id: string;
  cafeteria_id: string;
  sucursal_id: string;
  items: PedidoItem[];
  total: number;
  estado: EstadoPedido;
  tipo_pedido: TipoPedido;
  comprobante_url: string | null;
  hora_recogida: string | null;
  created_at: string;
  cliente?: { nom_completo: string; nom_usuario: string };
}

export interface CrearPedidoData {
  cliente_id: string;
  cafeteria_id: string;
  sucursal_id: string;
  items: PedidoItem[];
  total: number;
  tipo_pedido: TipoPedido;
  comprobante_url?: string;
  hora_recogida?: string;
}
