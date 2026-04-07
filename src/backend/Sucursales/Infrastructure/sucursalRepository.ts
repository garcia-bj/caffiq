import { supabase } from "../../supabase";
import { Sucursal } from "../Domain/sucursal";

export const getSucursalesDB = async () => {
  const { data, error } = await supabase.from("Sucursal").select("*");

  return { data, error };
};

export const addSucursalDB = async (sucursal: Sucursal) => {
  const { data, error } = await supabase.from("Sucursal").insert([sucursal]);

  return { data, error };
};
