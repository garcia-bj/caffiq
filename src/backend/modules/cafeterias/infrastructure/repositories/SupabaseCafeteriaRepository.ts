import { supabaseAdmin } from "@config/supabase";
import type { ICafeteriaRepository } from "../../domain/repositories/ICafeteriaRepository";
import type { CafeteriaEntity } from "../../domain/entities/Cafeteria";

const TABLA = "cafeterias";

export class SupabaseCafeteriaRepository implements ICafeteriaRepository {

  async listar(): Promise<CafeteriaEntity[]> {
    const { data, error } = await supabaseAdmin
      .from(TABLA)
      .select("id, admin_id, nom_cafeteria, ciudad, descripcion, activa, created_at")
      .eq("activa", true)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as CafeteriaEntity[];
  }

  async buscarPorId(id: string): Promise<CafeteriaEntity | null> {
    const { data, error } = await supabaseAdmin
      .from(TABLA)
      .select("id, admin_id, nom_cafeteria, ciudad, descripcion, activa, created_at")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as CafeteriaEntity | null;
  }
}
