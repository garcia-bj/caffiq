export interface SucursalEntity {
  id: string;
  cafeteria_id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  horario_apertura: string | null;
  horario_cierre: string | null;
  imagen_url: string | null;
  latitud: number | null;
  longitud: number | null;
  activa: boolean;
  created_at: string;
  nom_cafeteria?: string; // incluido al hacer join con cafeterias
}

export interface CrearSucursalData {
  cafeteria_id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  horario_apertura?: string;
  horario_cierre?: string;
  imagen_url?: string;
  latitud?: number;
  longitud?: number;
}

export interface ModificarSucursalData {
  nombre?: string;
  direccion?: string;
  ciudad?: string;
  horario_apertura?: string;
  horario_cierre?: string;
  imagen_url?: string;
  latitud?: number;
  longitud?: number;
}
