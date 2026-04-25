import { supabaseAdmin } from "@config/supabase";
import type { IProductoRepository } from "../../domain/repositories/IProductoRepository";
import type { ProductoEntity, CrearProductoData } from "../../domain/entities/Producto";

const TABLA = "productos";

export class SupabaseProductoRepository implements IProductoRepository {

  async listarPorCafeteria(cafeteria_id: string, categoria?: string): Promise<ProductoEntity[]> {
    let query = supabaseAdmin
      .from(TABLA)
      .select("*")
      .eq("cafeteria_id", cafeteria_id)
      .eq("disponible", true)
      .order("created_at", { ascending: true });

    if (categoria && categoria !== "Todos") {
      query = query.eq("categoria", categoria);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as ProductoEntity[];
  }

  async buscarPorId(id: string): Promise<ProductoEntity | null> {
    const { data, error } = await supabaseAdmin
      .from(TABLA)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as ProductoEntity | null;
  }

  async crear(datos: CrearProductoData): Promise<ProductoEntity> {
    const { data, error } = await supabaseAdmin
      .from(TABLA)
      .insert([{
        cafeteria_id: datos.cafeteria_id,
        nombre:       datos.nombre,
        descripcion:  datos.descripcion  ?? null,
        precio:       datos.precio,
        categoria:    datos.categoria,
        imagen_url:   datos.imagen_url   ?? null,
        badge:        datos.badge        ?? null,
        disponible:   true,
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ProductoEntity;
  }

  async toggleDisponible(id: string, disponible: boolean): Promise<void> {
    const { error } = await supabaseAdmin
      .from(TABLA)
      .update({ disponible })
      .eq("id", id);

    if (error) throw new Error(error.message);
  }
}
