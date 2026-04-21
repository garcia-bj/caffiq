export interface Sucursal {
  id_sucursal: string;      // Es tipo uuid en la base de datos
  nombre: string;           // Es NON-NULLABLE (obligatorio)
  direccion: string | null; // Es NULLABLE (opcional)
  imagen: string | null;    // Es NULLABLE (opcional)
  estado_sucursal: boolean | null; // Es NULLABLE
}
