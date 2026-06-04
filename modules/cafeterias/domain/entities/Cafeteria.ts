export interface CafeteriaEntity {
  id: string;
  admin_id: string;
  nom_cafeteria: string;
  direccion: string;
  ciudad: string;
  descripcion: string | null;
  horario_apertura: string | null;
  horario_cierre: string | null;
  logo_url: string | null;
  banner_url: string | null;
  qr_pago_url: string | null;
  activa: boolean;
  created_at: string;
}

export interface CafeteriaUpdateInput {
  descripcion?: string | null;
  horario_apertura?: string | null;
  horario_cierre?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  qr_pago_url?: string | null;
}
