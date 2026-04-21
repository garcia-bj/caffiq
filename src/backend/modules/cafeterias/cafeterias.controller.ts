import type { Request, Response, NextFunction } from "express";
import { cafeteriasService } from "./cafeterias.service";

export const cafeteriasController = {

  // GET /api/cafeterias
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const cafeterias = await cafeteriasService.listar();
      res.status(200).json({ cafeterias });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/cafeterias/:id/sucursales
  async sucursales(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const sucursales = await cafeteriasService.sucursales(id);
      res.status(200).json({ sucursales });
    } catch (err) {
      next(err);
    }
  },
};
