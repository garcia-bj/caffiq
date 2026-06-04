import { supabase } from "../../../../supabase";
import { Producto, SucursalProducto } from "../domain/menu";

// Crea el producto y lo asocia a la sucursal
export const agregarProductoDB = async (
  producto: Producto,
  id_sucursal: string
) => {
  // 1. Insertar el producto
  const { data: productoCreado, error: errorProducto } = await supabase
    .from("Producto")
    .insert([producto])
    .select()
    .single();

  if (errorProducto || !productoCreado) {
    return { data: null, error: errorProducto };
  }

  // 2. Insertar en la tabla intermedia
  const { data, error } = await supabase
    .from("Sucursal_producto")
    .insert([{ id_sucursal, id_producto: productoCreado.id_producto }])
    .select();

  return { data: productoCreado, error };
};

export const obtenerProductosPorSucursal = async (id_sucursal: string) => {
  const { data, error } = await supabase
    .from("Sucursal_producto")
    .select(`
      id_producto,
      Producto (
        id_producto,
        nom_producto,
        descripcion,
        precio,
        stock,
        estado,
        imagen_producto
      )
    `)
    .eq("id_sucursal", id_sucursal);

  if (error) throw new Error(`Error en Supabase: ${error.message}`);

  return data
    ?.map((sp: any) => sp.Producto)
    .filter((p: any) => p?.estado === true); // ← solo activos
};

// Obtener todos los productos sin filtro
export const obtenerTodosLosProductos = async () => {
  const { data, error } = await supabase
    .from("Sucursal_producto")
    .select(`
      id_sucursal,
      Producto (
        id_producto,
        nom_producto,
        descripcion,
        precio,
        stock,
        estado,
        imagen_producto
      )
    `);

  if (error) throw new Error(`Error en Supabase: ${error.message}`);
  return data?.map((sp: any) => ({ ...sp.Producto, id_sucursal: sp.id_sucursal }));
};

// Para modificar — todos sin filtro por estado

export const obtenerTodosProductosPorSucursal = async (id_sucursal: string) => {
  const { data, error } = await supabase
    .from("Sucursal_producto")
    .select(`
      id_producto,
      Producto (
        id_producto,
        nom_producto,
        descripcion,
        precio,
        stock,
        estado,
        imagen_producto
      )
    `)
    .eq("id_sucursal", id_sucursal);

  if (error) throw new Error(`Error en Supabase: ${error.message}`);

  console.log("📦 Raw Supabase:", JSON.stringify(data)); // ← agrega

  const productos = data?.map((sp: any) => sp.Producto);
  
  console.log("📦 Productos mapeados:", JSON.stringify(productos)); // ← agrega

  return productos;
};
// Modificar producto
export const modificarProductoDB = async (id: string, datos: {
  nom_producto: string;
  descripcion: string | null;
  precio: number;
  stock: number | null;
  imagen_producto: string | null;
  estado: boolean;
}) => {
  const { data, error } = await supabase
    .from("Producto")
    .update(datos)
    .eq("id_producto", id)
    .select();
  return { data, error };
};

// Suspender producto (eliminación lógica)
export const suspenderProductoDB = async (id: string) => {
  const { data, error } = await supabase
    .from("Producto")
    .update({ estado: false })
    .eq("id_producto", id)
    .select();
  return { data, error };
};

export const obtenerProductoPorId = async (id: string) => {
  const { data, error } = await supabase
    .from("Producto")
    .select("*")
    .eq("id_producto", id)
    .single();
  if (error) throw new Error(error.message);
  return data;
};

