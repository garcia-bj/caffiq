import type { Request, Response, NextFunction } from "express";
import { AppError } from "@shared/errors/AppError";
import { SupabaseProductoRepository } from "../infrastructure/repositories/SupabaseProductoRepository";
import { ListarProductos } from "../application/use-cases/ListarProductos";
import { CrearProducto } from "../application/use-cases/CrearProducto";

const repo          = new SupabaseProductoRepository();
const listar        = new ListarProductos(repo);
const crear         = new CrearProducto(repo);

export const productosController = {

  // GET /api/cafeterias/:cafeteria_id/productos?categoria=Espresso
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const { cafeteria_id } = req.params;
      const { categoria }    = req.query as { categoria?: string };
      const productos = await listar.execute(cafeteria_id, categoria);
      res.status(200).json({ productos });
    } catch (err) { next(err); }
  },

  // POST /api/cafeterias/:cafeteria_id/productos
  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const { cafeteria_id } = req.params;
      const { nombre, descripcion, precio, categoria, imagen_url, badge } = req.body;
      if (!nombre || precio === undefined || !categoria) {
        throw new AppError("nombre, precio y categoria son requeridos", 400);
      }
      const producto = await crear.execute({
        cafeteria_id, nombre, descripcion, precio: Number(precio), categoria, imagen_url, badge,
      });
      res.status(201).json({ producto });
    } catch (err) { next(err); }
  },
};
