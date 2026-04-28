export interface ProductoEntity {
  id_producto: string;
  nom_producto: string;
  descripcion: string | null;
  precio: number;
  stock: number | null;
  estado: boolean | null;
  imagen_producto: string | null;
}

export interface CrearProductoData {
  id_sucursal: string;
  nom_producto: string;
  descripcion?: string;
  precio: number;
  stock?: number;
  imagen_producto?: string;
}
