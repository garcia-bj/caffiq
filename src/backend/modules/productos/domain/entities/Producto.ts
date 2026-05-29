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

export interface ModificarProductoData {
  nom_producto?: string;
  descripcion?: string;
  precio?: number;
  stock?: number;
  imagen_producto?: string;
  estado?: boolean;
}

export const toPublico = (p: ProductoEntity, cafeteria_id: string) => ({
  id:           p.id_producto,
  cafeteria_id,
  nombre:       p.nom_producto,
  descripcion:  p.descripcion   ?? null,
  precio:       p.precio,
  imagen_url:   p.imagen_producto ?? null,
  disponible:   p.estado         ?? false,
  stock:        p.stock          ?? null,
  categoria:    "General",
  badge:        null as string | null,
  created_at:   "",
});
