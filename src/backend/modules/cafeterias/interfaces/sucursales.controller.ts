import type { Request, Response, NextFunction } from "express";
import { AppError } from "@shared/errors/AppError";

import { SupabaseCafeteriaRepository } from "../infrastructure/repositories/SupabaseCafeteriaRepository";
import { SupabaseSucursalRepository } from "../infrastructure/repositories/SupabaseSucursalRepository";

import { ObtenerSucursales } from "../application/use-cases/ObtenerSucursales";
import { CrearSucursal } from "../application/use-cases/CrearSucursal";
import { ModificarSucursal } from "../application/use-cases/ModificarSucursal";
import { SuspenderSucursal } from "../application/use-cases/SuspenderSucursal";

const cafeteriaRepo    = new SupabaseCafeteriaRepository();
const sucursalRepo     = new SupabaseSucursalRepository();

const obtenerSucursales = new ObtenerSucursales(cafeteriaRepo, sucursalRepo);
const crearSucursal     = new CrearSucursal(cafeteriaRepo, sucursalRepo);
const modificarSucursal = new ModificarSucursal(sucursalRepo);
const suspenderSucursal = new SuspenderSucursal(sucursalRepo);

export const sucursalesController = {

  // GET /api/cafeterias/:cafeteria_id/sucursales
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const { cafeteria_id } = req.params;
      const sucursales = await obtenerSucursales.execute(cafeteria_id);
      res.status(200).json({ sucursales });
    } catch (err) { next(err); }
  },

  // POST /api/cafeterias/:cafeteria_id/sucursales
  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const { cafeteria_id } = req.params;
      const { nombre, direccion, ciudad, horario_apertura, horario_cierre, imagen_url, latitud, longitud } = req.body;

      if (!nombre || !direccion || !ciudad) {
        throw new AppError("nombre, direccion y ciudad son requeridos", 400);
      }

      const sucursal = await crearSucursal.execute({
        cafeteria_id, nombre, direccion, ciudad,
        horario_apertura, horario_cierre, imagen_url, latitud, longitud,
      });
      res.status(201).json({ sucursal });
    } catch (err) { next(err); }
  },

  // PUT /api/cafeterias/:cafeteria_id/sucursales/:id
  async modificar(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { nombre, direccion, ciudad, horario_apertura, horario_cierre, imagen_url, latitud, longitud } = req.body;
      const sucursal = await modificarSucursal.execute(id, {
        nombre, direccion, ciudad,
        horario_apertura, horario_cierre, imagen_url, latitud, longitud,
      });
      res.status(200).json({ sucursal });
    } catch (err) { next(err); }
  },

  // PATCH /api/cafeterias/:cafeteria_id/sucursales/:id/suspender
  async suspender(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const resultado = await suspenderSucursal.execute(id);
      res.status(200).json(resultado);
    } catch (err) { next(err); }
  },
};
