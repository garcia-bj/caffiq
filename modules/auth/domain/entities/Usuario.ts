export type Rol = "cliente" | "admin";

export interface UsuarioEntity {
  id: string;
  nom_usuario: string;
  nom_completo: string;
  num_telefono: string;
  password: string;
  rol: Rol;
  telefono_verificado: boolean;
  created_at: string;
  google_id?: string;
}

export interface CafeteriaEntity {
  id: string;
  admin_id: string;
  nom_cafeteria: string;
  ciudad: string;
  descripcion: string | null;
  activa: boolean;
  created_at: string;
}
