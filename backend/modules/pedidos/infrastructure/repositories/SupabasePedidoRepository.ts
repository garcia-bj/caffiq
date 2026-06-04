import { supabaseAdmin } from "@config/supabase";
import { AppError } from "@shared/errors/AppError";
import type { PedidoEntity, CrearPedidoData, EstadoPedido, TipoPedido } from "../../domain/entities/Pedido";

const TABLA = "pedidos";

export class SupabasePedidoRepository {

  async crear(datos: CrearPedidoData): Promise<PedidoEntity> {
    const { data, error } = await supabaseAdmin
      .from(TABLA)
      .insert({
        cliente_id:      datos.cliente_id,
        cafeteria_id:    datos.cafeteria_id,
        sucursal_id:     datos.sucursal_id,
        items:           datos.items,
        total:           datos.total,
        tipo_pedido:     datos.tipo_pedido,
        comprobante_url: datos.comprobante_url ?? null,
        hora_recogida:   datos.hora_recogida ?? null,
        estado:          "pendiente",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as PedidoEntity;
  }

  async listarPorCafeteria(cafeteria_id: string, estado?: EstadoPedido): Promise<PedidoEntity[]> {
    let query = supabaseAdmin
      .from(TABLA)
      .select(`*, cliente:usuarios(nom_completo, nom_usuario)`)
      .eq("cafeteria_id", cafeteria_id)
      .order("created_at", { ascending: false });

    if (estado) query = query.eq("estado", estado);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as PedidoEntity[];
  }

  async listarPorCliente(cliente_id: string): Promise<PedidoEntity[]> {
    const { data, error } = await supabaseAdmin
      .from(TABLA)
      .select("*")
      .eq("cliente_id", cliente_id)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as PedidoEntity[];
  }

  async actualizarEstado(id: string, cafeteria_id: string, estado: EstadoPedido, motivo_rechazo?: string): Promise<PedidoEntity> {
    const updates: Record<string, unknown> = { estado };
    if (estado === "rechazado" && motivo_rechazo) updates.motivo_rechazo = motivo_rechazo;

    const { data, error } = await supabaseAdmin
      .from(TABLA)
      .update(updates)
      .eq("id", id)
      .eq("cafeteria_id", cafeteria_id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new AppError("Pedido no encontrado", 404);
    return data as PedidoEntity;
  }
}
