import type { IProductoRepository } from "../../domain/repositories/IProductoRepository";
import type { ProductoEntity } from "../../domain/entities/Producto";

export class ListarProductos {
  constructor(private readonly repo: IProductoRepository) {}

  async execute(cafeteria_id: string, categoria?: string): Promise<ProductoEntity[]> {
    return this.repo.listarPorCafeteria(cafeteria_id, categoria);
  }
}
