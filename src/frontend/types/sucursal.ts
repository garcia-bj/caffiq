// frontend/types/sucursal.ts
export interface Sucursal {
  id_sucursal: string;      // uuid en la DB
  nombre: string;           // varchar
  direccion: string | null; // nullable
  imagen: string | null;    // nullable
  estado_sucursal: boolean; // bool
}