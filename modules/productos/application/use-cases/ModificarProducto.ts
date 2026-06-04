import type { IProductoRepository } from "../../domain/repositories/IProductoRepository";
import type { ProductoEntity, ModificarProductoData } from "../../domain/entities/Producto";
import { AppError } from "@shared/errors/AppError";

export class ModificarProducto {
  constructor(private readonly repo: IProductoRepository) {}

  async execute(id: string, datos: ModificarProductoData): Promise<ProductoEntity> {
    const existente = await this.repo.buscarPorId(id);
    if (!existente) throw new AppError("Producto no encontrado", 404);
    return this.repo.modificar(id, datos);
  }
}
