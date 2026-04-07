import { Sucursal } from "../Domain/sucursal";
import {
    addSucursalDB,
    getSucursalesDB,
} from "../Infrastructure/sucursalRepository";

export const crearSucursal = async (sucursal: Sucursal) => {
  return await addSucursalDB(sucursal);
};

export const listarSucursales = async () => {
  return await getSucursalesDB();
};
