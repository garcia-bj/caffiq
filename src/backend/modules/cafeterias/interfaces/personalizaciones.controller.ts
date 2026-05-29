import type { Request, Response, NextFunction } from "express";
import { AppError } from "@shared/errors/AppError";
import { SupabasePersonalizacionRepository } from "../infrastructure/repositories/SupabasePersonalizacionRepository";

const repo = new SupabasePersonalizacionRepository();

export const personalizacionesController = {

  // GET /api/cafeterias/:cafeteria_id/personalizaciones
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const { cafeteria_id } = req.params;
      const personalizaciones = await repo.listar(cafeteria_id);
      res.status(200).json({ personalizaciones });
    } catch (err) { next(err); }
  },

  // POST /api/cafeterias/:cafeteria_id/personalizaciones
  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const { cafeteria_id } = req.params;
      const { nombre, requerido, orden } = req.body;
      if (!nombre?.trim()) throw new AppError("El nombre es requerido", 400);
      const personalizacion = await repo.crear(cafeteria_id, { nombre: nombre.trim(), requerido, orden });
      res.status(201).json({ personalizacion });
    } catch (err) { next(err); }
  },

  // PUT /api/cafeterias/:cafeteria_id/personalizaciones/:id
  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const { cafeteria_id, id } = req.params;
      const { nombre, requerido, orden } = req.body;
      const personalizacion = await repo.actualizar(id, cafeteria_id, { nombre, requerido, orden });
      res.status(200).json({ personalizacion });
    } catch (err) { next(err); }
  },

  // DELETE /api/cafeterias/:cafeteria_id/personalizaciones/:id
  async eliminar(req: Request, res: Response, next: NextFunction) {
    try {
      const { cafeteria_id, id } = req.params;
      await repo.eliminar(id, cafeteria_id);
      res.status(200).json({ mensaje: "Personalización eliminada" });
    } catch (err) { next(err); }
  },

  // POST /api/cafeterias/:cafeteria_id/personalizaciones/:id/opciones
  async crearOpcion(req: Request, res: Response, next: NextFunction) {
    try {
      const { cafeteria_id, id } = req.params;
      const { nombre, precio_adicional, orden } = req.body;
      if (!nombre?.trim()) throw new AppError("El nombre de la opción es requerido", 400);
      const opcion = await repo.crearOpcion(id, cafeteria_id, { nombre: nombre.trim(), precio_adicional, orden });
      res.status(201).json({ opcion });
    } catch (err) { next(err); }
  },

  // PUT /api/cafeterias/:cafeteria_id/personalizaciones/:id/opciones/:opcion_id
  async actualizarOpcion(req: Request, res: Response, next: NextFunction) {
    try {
      const { cafeteria_id, id, opcion_id } = req.params;
      const { nombre, precio_adicional, orden } = req.body;
      const opcion = await repo.actualizarOpcion(opcion_id, id, cafeteria_id, { nombre, precio_adicional, orden });
      res.status(200).json({ opcion });
    } catch (err) { next(err); }
  },

  // DELETE /api/cafeterias/:cafeteria_id/personalizaciones/:id/opciones/:opcion_id
  async eliminarOpcion(req: Request, res: Response, next: NextFunction) {
    try {
      const { cafeteria_id, id, opcion_id } = req.params;
      await repo.eliminarOpcion(opcion_id, id, cafeteria_id);
      res.status(200).json({ mensaje: "Opción eliminada" });
    } catch (err) { next(err); }
  },
};
