export interface CafeteriaEntity {
  id: string;
  admin_id: string;
  nom_cafeteria: string;
  direccion: string;
  ciudad: string;
  descripcion: string | null;
  horario_apertura: string | null;
  horario_cierre: string | null;
  activa: boolean;
  created_at: string;
}
