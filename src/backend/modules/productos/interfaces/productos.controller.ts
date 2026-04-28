import type { Request, Response, NextFunction } from "express";
import { AppError } from "@shared/errors/AppError";
import { SupabaseProductoRepository } from "../infrastructure/repositories/SupabaseProductoRepository";
import { ListarProductos } from "../application/use-cases/ListarProductos";
import { CrearProducto } from "../application/use-cases/CrearProducto";

const repo   = new SupabaseProductoRepository();
const listar = new ListarProductos(repo);
const crear  = new CrearProducto(repo);

export const productosController = {

  // GET /api/cafeterias/:cafeteria_id/productos
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const { cafeteria_id } = req.params;
      const productos = await listar.execute(cafeteria_id);
      res.status(200).json({ productos });
    } catch (err) { next(err); }
  },

  // POST /api/cafeterias/:cafeteria_id/productos
  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const { cafeteria_id } = req.params;
      const { id_sucursal, nom_producto, descripcion, precio, stock, imagen_producto } = req.body;

      if (!id_sucursal || !nom_producto || precio === undefined) {
        throw new AppError("id_sucursal, nom_producto y precio son requeridos", 400);
      }

      const producto = await crear.execute({
        id_sucursal,
        nom_producto,
        descripcion,
        precio: Number(precio),
        stock:  stock ? Number(stock) : undefined,
        imagen_producto,
      });

      res.status(201).json({ producto });
    } catch (err) { next(err); }
  },
};
