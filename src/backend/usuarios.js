import { supabase } from "./supabase";

export const getUsuarios = async () => {
  const { data, error } = await supabase
    .from("Usuarios")
    .select("*");

  return { data, error };
};

export const crearUsuario = async (nombre, correo) => {
  const { data, error } = await supabase
    .from("Usuarios")
    .insert([{ nombre, correo }])
    .select(); 

  return { data, error };
};