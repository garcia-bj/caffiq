// backend/src/modules/sucursal/infrastructure/sucursalRepository.ts
import { supabase } from "../../../../supabase"; // Importa la conexión a Supabase
import { Sucursal } from "../domain/sucursal"; // Importa la interface del Paso 1

export const obtenerTodasLasSucursales = async (): Promise<Sucursal[]> => {
  // Realizamos la consulta a la tabla 'Sucursal'
  const { data, error } = await supabase
    .from("Sucursal") // El nombre debe ser idéntico al de tu DB
    .select("*")
    .eq("estado_sucursal", true); // Filtramos solo las que están activas

  // Si hay un error en la base de datos, lo lanzamos para que el controlador lo atrape
  if (error) {
    throw new Error(`Error en Supabase: ${error.message}`);
  }

  // Retornamos los datos con el formato de la interface
  return data as Sucursal[];
};