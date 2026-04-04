import { supabase } from "./supabase";

export const getUsuarios = async () => {
  const { data, error } = await supabase
    .from("Usuario")
    .select("*");

  return { data, error };
};
