import type { Request, Response, NextFunction } from "express";
import { SupabaseCafeteriaRepository } from "../infrastructure/repositories/SupabaseCafeteriaRepository";
import { ListarCafeterias } from "../application/use-cases/ListarCafeterias";

const cafeteriaRepo    = new SupabaseCafeteriaRepository();
const listarCafeterias = new ListarCafeterias(cafeteriaRepo);

export const cafeteriasController = {

  // GET /api/cafeterias
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const cafeterias = await listarCafeterias.execute();
      res.status(200).json({ cafeterias });
    } catch (err) { next(err); }
  },
};
