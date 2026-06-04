import { Sucursal } from "../domain/sucursal";
import {
    addSucursalDB,
    obtenerTodasLasSucursales,
    obtenerTodasSucursalesSinFiltro, 
} from "../infrastructure/sucursalRepository";

export const crearSucursal = async (sucursal: Sucursal) => {
  return await addSucursalDB(sucursal);
};

export const listarSucursales = async () => {
  return await obtenerTodasLasSucursales();
};

export const listarTodasSucursalesSinFiltro = async () => {
  return await obtenerTodasSucursalesSinFiltro();
}