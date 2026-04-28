import { AppError } from "@shared/errors/AppError";
import type { IProductoRepository } from "../../domain/repositories/IProductoRepository";
import type { ProductoEntity, CrearProductoData } from "../../domain/entities/Producto";

export class CrearProducto {
  constructor(private readonly repo: IProductoRepository) {}

  async execute(datos: CrearProductoData): Promise<ProductoEntity> {
    if (!datos.id_sucursal) throw new AppError("id_sucursal es requerido", 400);
    if (datos.precio <= 0)  throw new AppError("El precio debe ser mayor a 0", 400);
    return this.repo.crear(datos);
  }
}
