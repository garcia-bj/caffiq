// application/ModificarSucursal.ts
import {
  modificarSucursalDB,
  getSucursalById,
  verificarDuplicadoDB,
} from "../infrastructure/sucursalRepository";

export const modificarSucursal = async (id: string, datos: {
  nombre: string;
  direccion: string;
  imagen: string;
  estado_sucursal: boolean;
}) => {
  // Validar campos vacíos
  if (!datos.nombre || !datos.direccion || !datos.imagen) {
    return { data: null, error: "Todos los campos son obligatorios" };
  }

  // Verificar que existe
  const { data: sucursal, error } = await getSucursalById(id);
  if (error || !sucursal) {
    return { data: null, error: "Sucursal no encontrada" };
  }

  // Verificar duplicados (mismo nombre y dirección en otra sucursal)
  const duplicado = await verificarDuplicadoDB(datos.nombre, datos.direccion, id);
  if (duplicado) {
    return { data: null, error: "Ya existe una sucursal con ese nombre y dirección" };
  }

  return await modificarSucursalDB(id, datos);
};