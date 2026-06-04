import { supabaseAdmin } from "@config/supabase";
import { AppError } from "@shared/errors/AppError";
import type { ICafeteriaRepository } from "../../domain/repositories/ICafeteriaRepository";
import type { CafeteriaEntity, CafeteriaUpdateInput } from "../../domain/entities/Cafeteria";

const TABLA = "cafeterias";
const CAMPOS = "id, admin_id, nom_cafeteria, ciudad, descripcion, horario_apertura, horario_cierre, logo_url, banner_url, qr_pago_url, activa, created_at";

export class SupabaseCafeteriaRepository implements ICafeteriaRepository {

  async listar(): Promise<CafeteriaEntity[]> {
    const { data, error } = await supabaseAdmin
      .from(TABLA)
      .select(CAMPOS)
      .eq("activa", true)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as CafeteriaEntity[];
  }

  async buscarPorId(id: string): Promise<CafeteriaEntity | null> {
    const { data, error } = await supabaseAdmin
      .from(TABLA)
      .select(CAMPOS)
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as CafeteriaEntity | null;
  }

  async actualizar(id: string, admin_id: string, datos: CafeteriaUpdateInput): Promise<CafeteriaEntity> {
    const { data, error } = await supabaseAdmin
      .from(TABLA)
      .update(datos)
      .eq("id", id)
      .eq("admin_id", admin_id)
      .select(CAMPOS)
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new AppError("Cafetería no encontrada o sin permiso", 404);
    return data as CafeteriaEntity;
  }
}
