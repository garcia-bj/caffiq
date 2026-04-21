import { supabaseAdmin } from "@config/supabase";
import type { CafeteriaPublica, SucursalPublica } from "./cafeterias.dto";

const T_CAFETERIAS = "cafeterias";
const T_SUCURSALES = "sucursales";

export const cafeteriasRepository = {

  async listar(): Promise<CafeteriaPublica[]> {
    const { data, error } = await supabaseAdmin
      .from(T_CAFETERIAS)
      .select("id, nom_cafeteria, ciudad, descripcion, horario_apertura, horario_cierre, activa, created_at")
      .eq("activa", true)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as CafeteriaPublica[];
  },

  async buscarPorId(id: string): Promise<CafeteriaPublica | null> {
    const { data, error } = await supabaseAdmin
      .from(T_CAFETERIAS)
      .select("id, nom_cafeteria, ciudad, descripcion, horario_apertura, horario_cierre, activa, created_at")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as CafeteriaPublica | null;
  },

  async sucursalesPorCafeteria(cafeteria_id: string): Promise<SucursalPublica[]> {
    const { data, error } = await supabaseAdmin
      .from(T_SUCURSALES)
      .select("*")
      .eq("cafeteria_id", cafeteria_id)
      .eq("activa", true)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as SucursalPublica[];
  },
};
