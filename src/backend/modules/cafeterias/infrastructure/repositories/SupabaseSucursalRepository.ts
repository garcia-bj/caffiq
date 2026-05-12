import { supabaseAdmin } from "@config/supabase";
import type { ISucursalRepository } from "../../domain/repositories/ISucursalRepository";
import type { SucursalEntity, CrearSucursalData, ModificarSucursalData } from "../../domain/entities/Sucursal";

const TABLA = "Sucursal";

export class SupabaseSucursalRepository implements ISucursalRepository {

  async listarPorCafeteria(cafeteria_id: string): Promise<SucursalEntity[]> {
    const { data, error } = await supabaseAdmin
      .from(TABLA)
      .select("*")
      .eq("cafeteria_id", cafeteria_id)
      .eq("activa", true)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as SucursalEntity[];
  }

  async buscarPorId(id: string): Promise<SucursalEntity | null> {
    const { data, error } = await supabaseAdmin
      .from(TABLA)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as SucursalEntity | null;
  }

  async crear(datos: CrearSucursalData): Promise<SucursalEntity> {
    const { data, error } = await supabaseAdmin
      .from(TABLA)
      .insert([{
        cafeteria_id:     datos.cafeteria_id,
        nombre:           datos.nombre,
        direccion:        datos.direccion,
        ciudad:           datos.ciudad,
        horario_apertura: datos.horario_apertura ?? null,
        horario_cierre:   datos.horario_cierre   ?? null,
        imagen_url:       datos.imagen_url        ?? null,
        latitud:          datos.latitud           ?? null,
        longitud:         datos.longitud          ?? null,
        activa:           true,
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as SucursalEntity;
  }

  async modificar(id: string, datos: ModificarSucursalData): Promise<SucursalEntity> {
    const updates: Record<string, unknown> = {};
    if (datos.nombre           !== undefined) updates.nombre           = datos.nombre;
    if (datos.direccion        !== undefined) updates.direccion        = datos.direccion;
    if (datos.ciudad           !== undefined) updates.ciudad           = datos.ciudad;
    if (datos.horario_apertura !== undefined) updates.horario_apertura = datos.horario_apertura;
    if (datos.horario_cierre   !== undefined) updates.horario_cierre   = datos.horario_cierre;
    if (datos.imagen_url       !== undefined) updates.imagen_url       = datos.imagen_url;
    if (datos.latitud          !== undefined) updates.latitud          = datos.latitud;
    if (datos.longitud         !== undefined) updates.longitud         = datos.longitud;

    const { data, error } = await supabaseAdmin
      .from(TABLA)
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as SucursalEntity;
  }

  async suspender(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from(TABLA)
      .update({ activa: false })
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  async listarTodas(): Promise<SucursalEntity[]> {
    const { data, error } = await supabaseAdmin
      .from(TABLA)
      .select("*, cafeterias(nom_cafeteria)")
      .eq("activa", true)
      .order("nombre", { ascending: true });

    if (error) throw new Error(error.message);

    return ((data ?? []) as any[]).map((row) => {
      const { cafeterias, ...rest } = row;
      return {
        ...rest,
        nom_cafeteria: (cafeterias as { nom_cafeteria: string } | null)?.nom_cafeteria ?? null,
      } as SucursalEntity;
    });
  }

  async existeNombreEnCafeteria(nombre: string, cafeteria_id: string, excluirId?: string): Promise<boolean> {
    let query = supabaseAdmin
      .from(TABLA)
      .select("id")
      .eq("nombre", nombre)
      .eq("cafeteria_id", cafeteria_id);

    if (excluirId) {
      query = query.neq("id", excluirId);
    }

    const { data, error } = await query.limit(1);
    if (error) throw new Error(error.message);
    return (data?.length ?? 0) > 0;
  }
}
