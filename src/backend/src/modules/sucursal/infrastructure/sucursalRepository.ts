import { supabase } from "../../../../supabase"; 
import { Sucursal } from "../domain/sucursal";

export const getSucursalesDB = async()=>{
  const { data, error } = await supabase
    .from("Sucursal")
    .select("*")
    .eq("estado_sucursal", true); // 👈 SOLO ACTIVAS

  return { data, error };
};

export const addSucursalDB = async (sucursal: Sucursal) => {
  const { data, error } = await supabase.from("Sucursal").insert([sucursal]);

  return { data, error };
};

// infrastructure/sucursalRepository.ts
// sucursalRepository.ts
export const getSucursalById = async (id: string) => { // 👈 string
  return await supabase
    .from("Sucursal")
    .select("*")
    .eq("id_sucursal", id)
    .single();
};

export const suspenderSucursalDB = async (id: string) => { // 👈 string
  const { data, error } = await supabase
    .from("Sucursal")
    .update({ estado_sucursal: false })
    .eq("id_sucursal", id)
    .select();

  return { data, error };
};

export const modificarSucursalDB = async (id: string, datos: {
  nombre: string;
  direccion: string;
  imagen: string;
}) => {
  const { data, error } = await supabase
    .from("Sucursal")
    .update(datos)
    .eq("id_sucursal", id)
    .select();

  return { data, error };
};

export const verificarDuplicadoDB = async (
  nombre: string,
  direccion: string,
  idExcluir: string
) => {
  const { data } = await supabase
    .from("Sucursal")
    .select("id_sucursal")
    .eq("nombre", nombre)
    .eq("direccion", direccion)
    .neq("id_sucursal", idExcluir) // excluye la sucursal actual
    .single();

  return !!data; // true si existe duplicado
};