export interface ProductoEntity {
  id: string;
  cafeteria_id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoria: string;
  imagen_url: string | null;
  badge: string | null;
  disponible: boolean;
  created_at: string;
}

export interface CrearProductoData {
  cafeteria_id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  categoria: string;
  imagen_url?: string;
  badge?: string;
}
