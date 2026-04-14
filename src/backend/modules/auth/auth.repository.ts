import { supabaseAdmin } from "@config/supabase";
import type { RegisterDTO, UsuarioRow, CafeteriaDTO, CafeteriaRow } from "./auth.dto";

const T_USUARIOS   = "usuarios";
const T_CAFETERIAS = "cafeterias";

export const authRepository = {

  // ── Crear usuario nuevo ───────────────────────────────────────────────────
  async crear(datos: Omit<RegisterDTO, "password" | "cafeteria"> & { password_hash: string }): Promise<UsuarioRow> {
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
    return data as UsuarioRow;
  },

  // ── Crear cafeteria ligada al admin ───────────────────────────────────────
  async crearCafeteria(admin_id: string, datos: CafeteriaDTO): Promise<CafeteriaRow> {
    const { data, error } = await supabaseAdmin
      .from(T_CAFETERIAS)
      .insert([{
        admin_id,
        nom_cafeteria:    datos.nom_cafeteria,
        direccion:        datos.direccion,
        ciudad:           datos.ciudad,
        descripcion:      datos.descripcion ?? null,
        horario_apertura: datos.horario_apertura ?? null,
        horario_cierre:   datos.horario_cierre   ?? null,
        activa:           true,
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as CafeteriaRow;
  },

  // ── Buscar por nom_usuario ────────────────────────────────────────────────
  async buscarPorNombreUsuario(nom_usuario: string): Promise<UsuarioRow | null> {
    const { data, error } = await supabaseAdmin
      .from(T_USUARIOS)
      .select("*")
      .eq("nom_usuario", nom_usuario)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as UsuarioRow | null;
  },

  // ── Buscar por id ─────────────────────────────────────────────────────────
  async buscarPorId(id: string): Promise<UsuarioRow | null> {
    const { data, error } = await supabaseAdmin
      .from(T_USUARIOS)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as UsuarioRow | null;
  },

  // ── Verificar unicidad de nom_usuario o num_telefono ─────────────────────
  async existeNombreOTelefono(nom_usuario: string, num_telefono: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from(T_USUARIOS)
      .select("id")
      .or(`nom_usuario.eq.${nom_usuario},num_telefono.eq.${num_telefono}`)
      .limit(1);

    if (error) throw new Error(error.message);
    return (data?.length ?? 0) > 0;
  },

  // ── Marcar telefono como verificado ──────────────────────────────────────
  async marcarTelefonoVerificado(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from(T_USUARIOS)
      .update({ telefono_verificado: true })
      .eq("id", id);

    if (error) throw new Error(error.message);
  },

  // ── Obtener cafeteria del admin ───────────────────────────────────────────
  async buscarCafeteriaPorAdmin(admin_id: string): Promise<CafeteriaRow | null> {
    const { data, error } = await supabaseAdmin
      .from(T_CAFETERIAS)
      .select("*")
      .eq("admin_id", admin_id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as CafeteriaRow | null;
  },

  // ── Upsert Google ─────────────────────────────────────────────────────────
  async upsertGoogle(datos: {
    nom_usuario:  string;
    nom_completo: string;
    num_telefono: string;
    rol:          "cliente" | "admin";
    google_id:    string;
  }): Promise<UsuarioRow> {
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
    return data as UsuarioRow;
  },
};
