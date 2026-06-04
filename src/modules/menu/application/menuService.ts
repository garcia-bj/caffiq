import { Producto } from "../domain/menu";
import {
  agregarProductoDB,
  obtenerProductosPorSucursal,
  obtenerTodosLosProductos,
  obtenerTodosProductosPorSucursal,
} from "../infrastructure/menuRepository";

export const crearProducto = async (producto: Producto, id_sucursal: string) => {
  return await agregarProductoDB(producto, id_sucursal);
};

export const listarProductosPorSucursal = async (id_sucursal: string) => {
  return await obtenerProductosPorSucursal(id_sucursal);
};

export const listarTodosLosProductos = async () => {
  return await obtenerTodosLosProductos();
};

export const listarTodosProductosPorSucursal = async (id_sucursal: string) => {
  return await obtenerTodosProductosPorSucursal(id_sucursal);
};
