import { supabaseAdmin } from "@config/supabase";
import type { IProductoRepository } from "../../domain/repositories/IProductoRepository";
import type { ProductoEntity, CrearProductoData, ModificarProductoData } from "../../domain/entities/Producto";

const PRODUCTO        = "Producto";
const SUCURSAL_PROD   = "Sucursal_producto";
const SUCURSAL        = "Sucursal";

export class SupabaseProductoRepository implements IProductoRepository {

  async listarPorCafeteria(cafeteria_id: string): Promise<ProductoEntity[]> {
    // Obtener IDs de sucursales activas de la cafetería
    const { data: sucursales, error: errSuc } = await supabaseAdmin
      .from(SUCURSAL)
      .select("id")
      .eq("cafeteria_id", cafeteria_id)
      .eq("activa", true);

    if (errSuc) throw new Error(errSuc.message);
    const ids = (sucursales ?? []).map((s: any) => s.id);
    if (ids.length === 0) return [];

    // Traer productos activos de esas sucursales via tabla intermedia
    const { data, error } = await supabaseAdmin
      .from(SUCURSAL_PROD)
      .select(`Producto ( id_producto, nom_producto, descripcion, precio, stock, estado, imagen_producto, categoria )`)
      .in("id_sucursal", ids);

    if (error) throw new Error(error.message);

    return (data ?? [])
      .map((sp: any) => sp.Producto)
      .filter((p: any) => p?.estado === true && (p.stock === null || p.stock > 0)) as ProductoEntity[];
  }

  async listarPorSucursal(sucursal_id: string, todos: boolean): Promise<ProductoEntity[]> {
    const { data, error } = await supabaseAdmin
      .from(SUCURSAL_PROD)
      .select(`Producto ( id_producto, nom_producto, descripcion, precio, stock, estado, imagen_producto, categoria )`)
      .eq("id_sucursal", sucursal_id);

    if (error) throw new Error(error.message);

    return (data ?? [])
      .map((sp: any) => sp.Producto)
      .filter((p: any): p is ProductoEntity => p != null && (todos || p.estado === true) && (p.stock === null || p.stock > 0));
  }

  async buscarPorId(id: string): Promise<ProductoEntity | null> {
    const { data, error } = await supabaseAdmin
      .from(PRODUCTO)
      .select("*")
      .eq("id_producto", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as ProductoEntity | null;
  }

  async crear(datos: CrearProductoData): Promise<ProductoEntity> {
    const stockNum = datos.stock ?? 0;

    // 1. Insertar producto
    const { data: productoCreado, error: errProd } = await supabaseAdmin
      .from(PRODUCTO)
      .insert([{
        nom_producto:    datos.nom_producto,
        descripcion:     datos.descripcion    ?? null,
        precio:          datos.precio,
        stock:           datos.stock          ?? null,
        imagen_producto: datos.imagen_producto ?? null,
        categoria:       datos.categoria      ?? 'General',
        estado:          stockNum > 0,
      }])
      .select()
      .single();

    if (errProd || !productoCreado) throw new Error(errProd?.message ?? "Error al crear producto");

    // 2. Asociar a la sucursal en tabla intermedia
    const { error: errAssoc } = await supabaseAdmin
      .from(SUCURSAL_PROD)
      .insert([{ id_sucursal: datos.id_sucursal, id_producto: productoCreado.id_producto }]);

    if (errAssoc) throw new Error(errAssoc.message);

    return productoCreado as ProductoEntity;
  }

  async modificar(id: string, datos: ModificarProductoData): Promise<ProductoEntity> {
    const update: Record<string, unknown> = {};
    if (datos.nom_producto  !== undefined) update.nom_producto   = datos.nom_producto;
    if (datos.descripcion   !== undefined) update.descripcion    = datos.descripcion;
    if (datos.precio        !== undefined) update.precio         = datos.precio;
    if (datos.stock         !== undefined) update.stock          = datos.stock;
    if (datos.imagen_producto !== undefined) update.imagen_producto = datos.imagen_producto;
    if (datos.estado        !== undefined) update.estado         = datos.estado;
    if (datos.categoria     !== undefined) update.categoria      = datos.categoria;

    const { data, error } = await supabaseAdmin
      .from(PRODUCTO)
      .update(update)
      .eq("id_producto", id)
      .select()
      .single();

    if (error || !data) throw new Error(error?.message ?? "Error al modificar producto");
    return data as ProductoEntity;
  }

  async suspender(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from(PRODUCTO)
      .update({ estado: false })
      .eq("id_producto", id);

    if (error) throw new Error(error.message);
  }
}
