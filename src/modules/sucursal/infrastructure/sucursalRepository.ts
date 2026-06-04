
import { supabase } from "../../../../supabase"; // ajusta la ruta
import { Sucursal } from "../domain/sucursal";

export const obtenerTodasLasSucursales = async (): Promise<Sucursal[]> => {
  const { data, error } = await supabase
    .from("Sucursal")
    .select("*")
    .eq("activa", true);

  if (error) {
    throw new Error(`Error en Supabase: ${error.message}`);
  }

  return data as Sucursal[];
};

export const addSucursalDB = async (sucursal: Sucursal) => {
  const { data, error } = await supabase.from("Sucursal").insert([sucursal]);
  return { data, error };
};

export const getSucursalById = async (id: string) => {
  return await supabase
    .from("Sucursal")
    .select("*")
    .eq("id", id)
    .single();
};

export const suspenderSucursalDB = async (id: string) => {
  const { data, error } = await supabase
    .from("Sucursal")
    .update({ activa: false })
    .eq("id", id)
    .select();
  return { data, error };
};

export const modificarSucursalDB = async (id: string, datos: {
  nombre: string;
  direccion: string;
  imagen_url: string;
  activa: boolean;
}) => {
  const { data, error } = await supabase
    .from("Sucursal")
    .update(datos)
    .eq("id", id)
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
    .select("id")
    .eq("nombre", nombre)
    .eq("direccion", direccion)
    .neq("id", idExcluir)
    .single();

  return !!data;
};

export const obtenerTodasSucursalesSinFiltro = async (): Promise<Sucursal[]> => {
  const { data, error } = await supabase
    .from("Sucursal")
    .select("*");

  if (error) {
    throw new Error(`Error en Supabase: ${error.message}`);
  }

  return data as Sucursal[];
};
