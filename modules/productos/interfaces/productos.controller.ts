import type { Request, Response, NextFunction } from "express";
import { AppError } from "@shared/errors/AppError";
import { SupabaseProductoRepository } from "../infrastructure/repositories/SupabaseProductoRepository";
import { ListarProductos } from "../application/use-cases/ListarProductos";
import { CrearProducto } from "../application/use-cases/CrearProducto";
import { ModificarProducto } from "../application/use-cases/ModificarProducto";
import { toPublico } from "../domain/entities/Producto";

const repo      = new SupabaseProductoRepository();
const listar    = new ListarProductos(repo);
const crear     = new CrearProducto(repo);
const modificar = new ModificarProducto(repo);

export const productosController = {

  // GET /api/cafeterias/:cafeteria_id/productos
  // Query ?sucursal_id=xxx&todos=true para admin filtrado por sucursal
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const { cafeteria_id }  = req.params;
      const { sucursal_id, todos } = req.query as { sucursal_id?: string; todos?: string };

      let productos;
      if (sucursal_id) {
        productos = await repo.listarPorSucursal(sucursal_id, todos === "true");
      } else {
        productos = await listar.execute(cafeteria_id);
      }

      res.status(200).json({ productos: productos.map((p) => toPublico(p, cafeteria_id)) });
    } catch (err) { next(err); }
  },

  // GET /api/cafeterias/:cafeteria_id/productos/:producto_id
  async obtener(req: Request, res: Response, next: NextFunction) {
    try {
      const { cafeteria_id, producto_id } = req.params;
      const producto = await repo.buscarPorId(producto_id);
      if (!producto) throw new AppError("Producto no encontrado", 404);
      res.status(200).json({ producto: toPublico(producto, cafeteria_id) });
    } catch (err) { next(err); }
  },

  // POST /api/cafeterias/:cafeteria_id/productos
  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const { cafeteria_id } = req.params;
      const { id_sucursal, nom_producto, descripcion, precio, stock, imagen_producto, categoria } = req.body;

      if (!id_sucursal || !nom_producto || precio === undefined) {
        throw new AppError("id_sucursal, nom_producto y precio son requeridos", 400);
      }

      const producto = await crear.execute({
        id_sucursal,
        nom_producto,
        descripcion,
        precio:  Number(precio),
        stock:   stock ? Number(stock) : undefined,
        imagen_producto,
        categoria,
      });

      res.status(201).json({ producto: toPublico(producto, cafeteria_id) });
    } catch (err) { next(err); }
  },

  // PUT /api/cafeterias/:cafeteria_id/productos/:producto_id
  async modificar(req: Request, res: Response, next: NextFunction) {
    try {
      const { cafeteria_id, producto_id } = req.params;
      const { nom_producto, descripcion, precio, stock, imagen_producto, estado, categoria } = req.body;

      const producto = await modificar.execute(producto_id, {
        nom_producto,
        descripcion,
        precio:          precio    !== undefined ? Number(precio) : undefined,
        stock:           stock     !== undefined ? Number(stock)  : undefined,
        imagen_producto: imagen_producto ?? undefined,
        estado:          estado    !== undefined ? Boolean(estado) : undefined,
        categoria,
      });

      res.status(200).json({ producto: toPublico(producto, cafeteria_id) });
    } catch (err) { next(err); }
  },

  // PATCH /api/cafeterias/:cafeteria_id/productos/:producto_id/suspender
  async suspender(req: Request, res: Response, next: NextFunction) {
    try {
      const { producto_id } = req.params;
      const existente = await repo.buscarPorId(producto_id);
      if (!existente) throw new AppError("Producto no encontrado", 404);
      await repo.suspender(producto_id);
      res.status(200).json({ mensaje: "Producto suspendido" });
    } catch (err) { next(err); }
  },
};
