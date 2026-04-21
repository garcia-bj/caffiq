// application/SuspenderSucursal.ts
import {
  suspenderSucursalDB,
  getSucursalById,
} from "../infrastructure/sucursalRepository";

export const suspenderSucursal = async (id: string) => {
  const { data: sucursal, error } = await getSucursalById(id);

  if (error || !sucursal) {
    return { data: null, error: "Sucursal no encontrada" }; // 👈 agrega data: null
  }

  if (!sucursal.estado_sucursal) {
    return { data: null, error: "La sucursal ya está suspendida" }; // 👈 agrega data: null
  }

  return await suspenderSucursalDB(id);
};