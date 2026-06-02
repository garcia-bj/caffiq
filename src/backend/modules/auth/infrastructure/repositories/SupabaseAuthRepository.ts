import { supabaseAdmin } from "@config/supabase";
import type { IAuthRepository, CreateUsuarioData, CafeteriaData } from "../../domain/repositories/IAuthRepository";
import type { UsuarioEntity, CafeteriaEntity, Rol } from "../../domain/entities/Usuario";

const T_USUARIOS   = "usuarios";
const T_CAFETERIAS = "cafeterias";

export class SupabaseAuthRepository implements IAuthRepository {

  async crear(datos: CreateUsuarioData): Promise<UsuarioEntity> {
    const { data, error } = await supabaseAdmin
      .from(T_USUARIOS)
      .insert([{
        nom_usuario:         datos.nom_usuario,
        nom_completo:        datos.nom_completo,
        num_telefono:        datos.num_telefono,
        password:            datos.password_hash,
        rol:                 datos.rol,
        telefono_verificado: false,
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as UsuarioEntity;
  }

  async crearCafeteria(admin_id: string, datos: CafeteriaData): Promise<CafeteriaEntity> {
    const { data, error } = await supabaseAdmin
      .from(T_CAFETERIAS)
      .insert([{
        admin_id,
        nom_cafeteria: datos.nom_cafeteria,
        ciudad:        datos.ciudad,
        descripcion:   datos.descripcion ?? null,
        activa:        true,
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as CafeteriaEntity;
  }

  async buscarPorNombreUsuario(nom_usuario: string): Promise<UsuarioEntity | null> {
    const { data, error } = await supabaseAdmin
      .from(T_USUARIOS)
      .select("*")
      .eq("nom_usuario", nom_usuario)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as UsuarioEntity | null;
  }

  async buscarPorId(id: string): Promise<UsuarioEntity | null> {
    const { data, error } = await supabaseAdmin
      .from(T_USUARIOS)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as UsuarioEntity | null;
  }

  async existeNombreOTelefono(nom_usuario: string, num_telefono: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from(T_USUARIOS)
      .select("id")
      .or(`nom_usuario.eq.${nom_usuario},num_telefono.eq.${num_telefono}`)
      .limit(1);

    if (error) throw new Error(error.message);
    return (data?.length ?? 0) > 0;
  }

  async marcarTelefonoVerificado(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from(T_USUARIOS)
      .update({ telefono_verificado: true })
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  async buscarCafeteriaPorAdmin(admin_id: string): Promise<CafeteriaEntity | null> {
    const { data, error } = await supabaseAdmin
      .from(T_CAFETERIAS)
      .select("*")
      .eq("admin_id", admin_id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as CafeteriaEntity | null;
  }

  async actualizarPerfil(
    id: string,
    datos: { nom_completo?: string; num_telefono?: string }
  ): Promise<UsuarioEntity> {
    const updates: Record<string, string> = {};
    if (datos.nom_completo) updates.nom_completo = datos.nom_completo;
    if (datos.num_telefono) updates.num_telefono = datos.num_telefono;

    const { data, error } = await supabaseAdmin
      .from(T_USUARIOS)
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as UsuarioEntity;
  }

  async upsertGoogle(datos: {
    nom_usuario: string;
    nom_completo: string;
    num_telefono: string;
    rol: Rol;
    google_id: string;
  }): Promise<UsuarioEntity> {
    const { data, error } = await supabaseAdmin
      .from(T_USUARIOS)
      .upsert(
        [{
          nom_usuario:         datos.nom_usuario,
          nom_completo:        datos.nom_completo,
          num_telefono:        datos.num_telefono || null,
          rol:                 datos.rol,
          password:            "",
          telefono_verificado: false,
          google_id:           datos.google_id,
        }],
        { onConflict: "google_id" }
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as UsuarioEntity;
  }

  async guardarPushToken(id: string, token: string | null): Promise<void> {
    const { error } = await supabaseAdmin
      .from(T_USUARIOS)
      .update({ expo_push_token: token })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async actualizarPassword(id: string, password_hash: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from(T_USUARIOS)
      .update({ password: password_hash })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async existeTelefonoEnOtroUsuario(telefono: string, excludeId: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from(T_USUARIOS)
      .select("id")
      .eq("num_telefono", telefono)
      .neq("id", excludeId)
      .limit(1);
    if (error) throw new Error(error.message);
    return (data?.length ?? 0) > 0;
  }

  async vincularGoogleId(id: string, google_id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from(T_USUARIOS)
      .update({ google_id })
      .eq("id", id);

    if (error) throw new Error(error.message);
  }
}
