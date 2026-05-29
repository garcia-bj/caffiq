import type { Request, Response, NextFunction } from "express";
import { AppError } from "@shared/errors/AppError";
import { SupabasePedidoRepository } from "../infrastructure/repositories/SupabasePedidoRepository";
import type { EstadoPedido, TipoPedido } from "../domain/entities/Pedido";

const repo = new SupabasePedidoRepository();

export const pedidosController = {

  // POST /api/pedidos
  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const cliente_id = req.user!.id;
      const { cafeteria_id, sucursal_id, items, total, tipo_pedido, comprobante_url } = req.body;

      if (!cafeteria_id || !sucursal_id) throw new AppError("cafeteria_id y sucursal_id son requeridos", 400);
      if (!items?.length)                throw new AppError("El pedido debe tener al menos un ítem", 400);
      if (!total || total <= 0)          throw new AppError("El total debe ser mayor a 0", 400);
      if (!["llevar", "local"].includes(tipo_pedido)) throw new AppError("tipo_pedido debe ser 'llevar' o 'local'", 400);

      const pedido = await repo.crear({ cliente_id, cafeteria_id, sucursal_id, items, total, tipo_pedido: tipo_pedido as TipoPedido, comprobante_url });
      res.status(201).json({ pedido });
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
      const { estado, cafeteria_id } = req.body;

      if (!["aprobado", "rechazado"].includes(estado)) {
        throw new AppError("Estado debe ser 'aprobado' o 'rechazado'", 400);
      }
      if (!cafeteria_id) throw new AppError("cafeteria_id es requerido", 400);

      const pedido = await repo.actualizarEstado(id, cafeteria_id, estado);
      res.status(200).json({ pedido });
    } catch (err) { next(err); }
  },
};
