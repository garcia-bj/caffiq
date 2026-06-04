import type { ProductoEntity, CrearProductoData, ModificarProductoData } from "../entities/Producto";

export interface IProductoRepository {
  listarPorCafeteria(cafeteria_id: string): Promise<ProductoEntity[]>;
  listarPorSucursal(sucursal_id: string, todos: boolean): Promise<ProductoEntity[]>;
  buscarPorId(id: string): Promise<ProductoEntity | null>;
  crear(datos: CrearProductoData): Promise<ProductoEntity>;
  modificar(id: string, datos: ModificarProductoData): Promise<ProductoEntity>;
  suspender(id: string): Promise<void>;
}
