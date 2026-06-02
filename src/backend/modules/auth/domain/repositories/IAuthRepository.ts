import type { UsuarioEntity, CafeteriaEntity, Rol } from "../entities/Usuario";

export interface CreateUsuarioData {
  nom_usuario: string;
  nom_completo: string;
  num_telefono: string;
  password_hash: string;
  rol: Rol;
}

export interface CafeteriaData {
  nom_cafeteria: string;
  ciudad: string;
  descripcion?: string;
}

export interface IAuthRepository {
  crear(datos: CreateUsuarioData): Promise<UsuarioEntity>;
  crearCafeteria(admin_id: string, datos: CafeteriaData): Promise<CafeteriaEntity>;
  buscarPorNombreUsuario(nom_usuario: string): Promise<UsuarioEntity | null>;
  buscarPorId(id: string): Promise<UsuarioEntity | null>;
  existeNombreOTelefono(nom_usuario: string, num_telefono: string): Promise<boolean>;
  marcarTelefonoVerificado(id: string): Promise<void>;
  buscarCafeteriaPorAdmin(admin_id: string): Promise<CafeteriaEntity | null>;
  actualizarPerfil(id: string, datos: { nom_completo?: string; num_telefono?: string }): Promise<UsuarioEntity>;
  actualizarPassword(id: string, password_hash: string): Promise<void>;
  existeTelefonoEnOtroUsuario(telefono: string, excludeId: string): Promise<boolean>;
  guardarPushToken(id: string, token: string | null): Promise<void>;
  upsertGoogle(datos: {
    nom_usuario: string;
    nom_completo: string;
    num_telefono: string;
    rol: Rol;
    google_id: string;
  }): Promise<UsuarioEntity>;
  vincularGoogleId(id: string, google_id: string): Promise<void>;
}
