export interface Producto {
  id_producto: string;
  id_sucursal?: string;
  nom_producto: string;
  descripcion: string | null;
  precio: number;
  stock: number | null;
  estado: boolean | null;
  imagen_producto: string | null;
}