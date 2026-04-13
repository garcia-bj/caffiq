import { Sucursal } from "../domain/sucursal";
import {
    addSucursalDB,
    getSucursalesDB,
} from "../infrastructure/sucursalRepository";

export const crearSucursal = async (sucursal: Sucursal) => {
  return await addSucursalDB(sucursal);
};

export const listarSucursales = async () => {
  return await getSucursalesDB();
};
