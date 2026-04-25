import type { ProductoEntity, CrearProductoData } from "../entities/Producto";

export interface IProductoRepository {
  listarPorCafeteria(cafeteria_id: string, categoria?: string): Promise<ProductoEntity[]>;
  buscarPorId(id: string): Promise<ProductoEntity | null>;
  crear(datos: CrearProductoData): Promise<ProductoEntity>;
  toggleDisponible(id: string, disponible: boolean): Promise<void>;
}
