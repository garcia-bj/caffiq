export interface Producto {
  id_producto?: string;
  nom_producto: string;
  descripcion: string | null;
  precio: number;
  stock: number | null;
  estado: boolean | null;
  imagen_producto: string | null;
}

export interface SucursalProducto {
  id?: string;
  id_sucursal: string;
  id_producto: string;
}