import type { Request, Response, NextFunction } from "express";
import { AppError } from "@shared/errors/AppError";
import { SupabaseCafeteriaRepository } from "../infrastructure/repositories/SupabaseCafeteriaRepository";
import { ListarCafeterias } from "../application/use-cases/ListarCafeterias";
import { ActualizarCafeteria } from "../application/use-cases/ActualizarCafeteria";

const cafeteriaRepo    = new SupabaseCafeteriaRepository();
const listarCafeterias = new ListarCafeterias(cafeteriaRepo);
const actualizarCafeteria = new ActualizarCafeteria(cafeteriaRepo);

export const cafeteriasController = {

  // GET /api/cafeterias
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const cafeterias = await listarCafeterias.execute();
      res.status(200).json({ cafeterias });
    } catch (err) { next(err); }
  },

  // GET /api/cafeterias/:id
  async obtener(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const cafeteria = await cafeteriaRepo.buscarPorId(id);
      if (!cafeteria) throw new AppError("Cafetería no encontrada", 404);
      res.status(200).json({ cafeteria });
    } catch (err) { next(err); }
  },

  // PATCH /api/cafeterias/:id
  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const admin_id = req.user!.id;
      const { descripcion, horario_apertura, horario_cierre, logo_url, banner_url, qr_pago_url } = req.body;
      const cafeteria = await actualizarCafeteria.execute(id, admin_id, {
        descripcion, horario_apertura, horario_cierre, logo_url, banner_url, qr_pago_url,
      });
      res.status(200).json({ cafeteria });
    } catch (err) { next(err); }
  },
};
