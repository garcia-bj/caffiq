// application/ModificarSucursal.ts
import {
  modificarSucursalDB,
  getSucursalById,
  verificarDuplicadoDB,
} from "../infrastructure/sucursalRepository";

export const modificarSucursal = async (id: string, datos: {
  nombre: string;
  direccion: string;
  imagen_url: string;
  activa: boolean;
}) => {
  if (!datos.nombre || !datos.direccion || !datos.imagen_url) {
    return { data: null, error: "Todos los campos son obligatorios" };
  }

  const { data: sucursal, error } = await getSucursalById(id);
  if (error || !sucursal) {
    return { data: null, error: "Sucursal no encontrada" };
  }

  const duplicado = await verificarDuplicadoDB(datos.nombre, datos.direccion, id);
  if (duplicado) {
    return { data: null, error: "Ya existe una sucursal con ese nombre y dirección" };
  }

  return await modificarSucursalDB(id, datos);
};
