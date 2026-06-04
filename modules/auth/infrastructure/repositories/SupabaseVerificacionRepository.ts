import { supabaseAdmin } from "@config/supabase";
import type { IVerificacionRepository, VerificacionCodigoRow } from "../../domain/repositories/IVerificacionRepository";

const TABLA = "codigos_verificacion";

export class SupabaseVerificacionRepository implements IVerificacionRepository {

  async invalidarAnteriores(usuario_id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from(TABLA)
      .update({ usado: true })
      .eq("usuario_id", usuario_id)
      .eq("usado", false);

    if (error) throw new Error(error.message);
  }

  async guardar(usuario_id: string, num_telefono: string, codigo: string, expira_en: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from(TABLA)
      .insert([{ usuario_id, num_telefono, codigo, expira_en }]);

    if (error) throw new Error(error.message);
  }

  async buscarValido(usuario_id: string, codigo: string): Promise<VerificacionCodigoRow | null> {
    const ahora = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from(TABLA)
      .select("*")
      .eq("usuario_id", usuario_id)
      .eq("codigo", codigo)
      .eq("usado", false)
      .gte("expira_en", ahora)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as VerificacionCodigoRow | null;
  }

  async marcarUsado(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from(TABLA)
      .update({ usado: true })
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  async tieneCodigoReciente(usuario_id: string): Promise<boolean> {
    const unMinutoAtras = new Date(Date.now() - 60 * 1000).toISOString();
    const { data, error } = await supabaseAdmin
      .from(TABLA)
      .select("id")
      .eq("usuario_id", usuario_id)
      .gte("created_at", unMinutoAtras)
      .limit(1);

    if (error) throw new Error(error.message);
    return (data?.length ?? 0) > 0;
  }
}
