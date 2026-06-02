import type { Request, Response, NextFunction } from "express";
import { AppError } from "@shared/errors/AppError";
import { supabaseAdmin } from "@config/supabase";
import { SupabasePedidoRepository } from "../infrastructure/repositories/SupabasePedidoRepository";
import type { EstadoPedido, TipoPedido } from "../domain/entities/Pedido";
import { enviarPushNotificacion } from "@shared/services/ExpoPushService";

const repo = new SupabasePedidoRepository();

export const pedidosController = {

  // POST /api/pedidos
  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const cliente_id = req.user!.id;
      const { cafeteria_id, sucursal_id, items, total, tipo_pedido, comprobante_url, hora_recogida } = req.body;

      if (!cafeteria_id || !sucursal_id) throw new AppError("cafeteria_id y sucursal_id son requeridos", 400);
      if (!items?.length)                throw new AppError("El pedido debe tener al menos un item", 400);
      if (!total || total <= 0)          throw new AppError("El total debe ser mayor a 0", 400);
      if (!["llevar", "local"].includes(tipo_pedido)) throw new AppError("tipo_pedido debe ser 'llevar' o 'local'", 400);

      const pedido = await repo.crear({ cliente_id, cafeteria_id, sucursal_id, items, total, tipo_pedido: tipo_pedido as TipoPedido, comprobante_url, hora_recogida });
      res.status(201).json({ pedido });

      // Notificar al admin — no-fatal, se ejecuta después de responder
      notificarAdmin(cafeteria_id, total, tipo_pedido, items.length).catch(() => {});
    } catch (err) { next(err); }
  },

  // GET /api/pedidos/mis-pedidos
  async misPedidos(req: Request, res: Response, next: NextFunction) {
    try {
      const pedidos = await repo.listarPorCliente(req.user!.id);
      res.status(200).json({ pedidos });
    } catch (err) { next(err); }
  },

  // GET /api/cafeterias/:cafeteria_id/pedidos?estado=pendiente
  async listarPorCafeteria(req: Request, res: Response, next: NextFunction) {
    try {
      const { cafeteria_id } = req.params;
      const estado = req.query.estado as EstadoPedido | undefined;
      const pedidos = await repo.listarPorCafeteria(cafeteria_id, estado);
      res.status(200).json({ pedidos });
    } catch (err) { next(err); }
  },

  // PATCH /api/pedidos/:id/estado
  async actualizarEstado(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { estado, cafeteria_id, motivo_rechazo } = req.body;

      if (!["aprobado", "rechazado"].includes(estado)) {
        throw new AppError("Estado debe ser 'aprobado' o 'rechazado'", 400);
      }
      if (!cafeteria_id) throw new AppError("cafeteria_id es requerido", 400);

      const pedido = await repo.actualizarEstado(id, cafeteria_id, estado, motivo_rechazo);
      res.status(200).json({ pedido });
    } catch (err) { next(err); }
  },
};

async function notificarAdmin(cafeteria_id: string, total: number, tipo_pedido: string, numItems: number) {
  const { data: cafeteria } = await supabaseAdmin
    .from("cafeterias")
    .select("admin_id")
    .eq("id", cafeteria_id)
    .single();

  if (!cafeteria?.admin_id) return;

  const { data: admin } = await supabaseAdmin
    .from("usuarios")
    .select("expo_push_token")
    .eq("id", cafeteria.admin_id)
    .maybeSingle();

  if (!admin?.expo_push_token) return;

  const tipoLabel = tipo_pedido === "local" ? "🪑 En el local" : "🛍️ Para llevar";
  await enviarPushNotificacion(
    admin.expo_push_token,
    "🛒 Nuevo pedido recibido",
    `${numItems} producto${numItems > 1 ? "s" : ""} · $${total.toFixed(2)} · ${tipoLabel}`,
    { screen: "pedidos" },
  );
}
