// application/SuspenderSucursal.ts
import {
  suspenderSucursalDB,
  getSucursalById,
} from "../infrastructure/sucursalRepository";

export const suspenderSucursal = async (id: string) => {
  const { data: sucursal, error } = await getSucursalById(id);

  if (error || !sucursal) {
    return { data: null, error: "Sucursal no encontrada" };
  }

  if (!sucursal.activa) {
    return { data: null, error: "La sucursal ya está suspendida" };
  }

  return await suspenderSucursalDB(id);
};
