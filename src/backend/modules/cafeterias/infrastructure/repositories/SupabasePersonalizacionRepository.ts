import { supabaseAdmin } from "@config/supabase";
import { AppError } from "@shared/errors/AppError";
import type {
  PersonalizacionEntity, OpcionPersonalizacion,
  PersonalizacionInput, OpcionInput,
} from "../../domain/entities/Personalizacion";

const T_PERS = "personalizaciones";
const T_OPC  = "opciones_personalizacion";

export class SupabasePersonalizacionRepository {

  async listar(cafeteria_id: string, sucursal_id?: string): Promise<PersonalizacionEntity[]> {
    let query = supabaseAdmin
      .from(T_PERS)
      .select(`*, opciones:${T_OPC}(id, personalizacion_id, nombre, precio_adicional, orden)`)
      .eq("cafeteria_id", cafeteria_id)
      .eq("activo", true)
      .order("orden", { ascending: true });

    if (sucursal_id) {
      query = query.eq("sucursal_id", sucursal_id);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as PersonalizacionEntity[];
  }

  async crear(cafeteria_id: string, datos: PersonalizacionInput): Promise<PersonalizacionEntity> {
    const { data, error } = await supabaseAdmin
      .from(T_PERS)
      .insert({ cafeteria_id, ...datos })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { ...data, opciones: [] } as PersonalizacionEntity;
  }

  async actualizar(id: string, cafeteria_id: string, datos: Partial<PersonalizacionInput>): Promise<PersonalizacionEntity> {
    const { data, error } = await supabaseAdmin
      .from(T_PERS)
      .update(datos)
      .eq("id", id)
      .eq("cafeteria_id", cafeteria_id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new AppError("Personalización no encontrada", 404);
    return { ...data, opciones: [] } as PersonalizacionEntity;
  }

  async eliminar(id: string, cafeteria_id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from(T_PERS)
      .update({ activo: false })
      .eq("id", id)
      .eq("cafeteria_id", cafeteria_id);

    if (error) throw new Error(error.message);
  }

  async crearOpcion(personalizacion_id: string, cafeteria_id: string, datos: OpcionInput): Promise<OpcionPersonalizacion> {
    const pers = await supabaseAdmin
      .from(T_PERS)
      .select("id")
      .eq("id", personalizacion_id)
      .eq("cafeteria_id", cafeteria_id)
      .maybeSingle();

    if (!pers.data) throw new AppError("Personalización no encontrada o sin permiso", 404);

    const { data, error } = await supabaseAdmin
      .from(T_OPC)
      .insert({ personalizacion_id, nombre: datos.nombre, precio_adicional: datos.precio_adicional ?? 0, orden: datos.orden ?? 0 })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as OpcionPersonalizacion;
  }

  async actualizarOpcion(opcion_id: string, personalizacion_id: string, cafeteria_id: string, datos: Partial<OpcionInput>): Promise<OpcionPersonalizacion> {
    const pers = await supabaseAdmin
      .from(T_PERS)
      .select("id")
      .eq("id", personalizacion_id)
      .eq("cafeteria_id", cafeteria_id)
      .maybeSingle();

    if (!pers.data) throw new AppError("Personalización no encontrada o sin permiso", 404);

    const { data, error } = await supabaseAdmin
      .from(T_OPC)
      .update(datos)
      .eq("id", opcion_id)
      .eq("personalizacion_id", personalizacion_id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new AppError("Opción no encontrada", 404);
    return data as OpcionPersonalizacion;
  }

  async eliminarOpcion(opcion_id: string, personalizacion_id: string, cafeteria_id: string): Promise<void> {
    const pers = await supabaseAdmin
      .from(T_PERS)
      .select("id")
      .eq("id", personalizacion_id)
      .eq("cafeteria_id", cafeteria_id)
      .maybeSingle();

    if (!pers.data) throw new AppError("Personalización no encontrada o sin permiso", 404);

    const { error } = await supabaseAdmin
      .from(T_OPC)
      .delete()
      .eq("id", opcion_id)
      .eq("personalizacion_id", personalizacion_id);

    if (error) throw new Error(error.message);
  }
}
