import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "@config/env";
import { AppError } from "@shared/errors/AppError";
import { authRepository } from "./auth.repository";
import { verificacionService } from "@modules/verificacion/verificacion.service";
import type { RegisterDTO, LoginDTO, AuthResponse, UsuarioPublico, UsuarioRow } from "./auth.dto";

const SALT_ROUNDS = 12;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generarToken = (usuario: UsuarioRow): string =>
  jwt.sign(
    { id: usuario.id, rol: usuario.rol },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn } as jwt.SignOptions
  );

const toPublico = (u: UsuarioRow, cafeteria_id?: string): UsuarioPublico => ({
  id:                  u.id,
  nom_usuario:         u.nom_usuario,
  nom_completo:        u.nom_completo,
  num_telefono:        u.num_telefono,
  rol:                 u.rol,
  telefono_verificado: u.telefono_verificado,
  created_at:          u.created_at,
  ...(cafeteria_id && { cafeteria_id }),
});

// ─── Servicio ─────────────────────────────────────────────────────────────────

export const authService = {

  // ── Registro ─────────────────────────────────────────────────────────────
  async registrar(datos: RegisterDTO): Promise<{ mensaje: string; usuario_id: string }> {
    // Validar campos de cafeteria para admin
    if (datos.rol === "admin" && !datos.cafeteria) {
      throw new AppError("Los datos de la cafetería son requeridos para administradores", 400);
    }

    // Verificar unicidad
    const existe = await authRepository.existeNombreOTelefono(datos.nom_usuario, datos.num_telefono);
    if (existe) throw new AppError("El nombre de usuario o número de teléfono ya está registrado", 409);

    // Hash del password
    const password_hash = await bcrypt.hash(datos.password, SALT_ROUNDS);

    // Crear usuario
    const usuario = await authRepository.crear({ ...datos, password_hash });

    // Crear cafeteria si es admin
    if (datos.rol === "admin" && datos.cafeteria) {
      await authRepository.crearCafeteria(usuario.id, datos.cafeteria);
    }

    // Enviar OTP via WhatsApp
    await verificacionService.enviarCodigo(usuario.id, datos.num_telefono, datos.nom_completo);

    return {
      mensaje:    "Cuenta creada. Verifica tu número de WhatsApp con el código enviado.",
      usuario_id: usuario.id,
    };
  },

  // ── Verificar telefono ────────────────────────────────────────────────────
  async verificarTelefono(usuario_id: string, codigo: string): Promise<AuthResponse> {
    const usuario = await authRepository.buscarPorId(usuario_id);
    if (!usuario) throw new AppError("Usuario no encontrado", 404);
    if (usuario.telefono_verificado) throw new AppError("El teléfono ya estaba verificado", 400);

    await verificacionService.verificarCodigo(usuario_id, codigo);
    await authRepository.marcarTelefonoVerificado(usuario_id);

    const cafeteria = usuario.rol === "admin"
      ? await authRepository.buscarCafeteriaPorAdmin(usuario_id)
      : null;

    return {
      token:   generarToken({ ...usuario, telefono_verificado: true }),
      usuario: toPublico({ ...usuario, telefono_verificado: true }, cafeteria?.id),
    };
  },

  // ── Login ─────────────────────────────────────────────────────────────────
  async login(datos: LoginDTO): Promise<AuthResponse> {
    const usuario = await authRepository.buscarPorNombreUsuario(datos.nom_usuario);
    if (!usuario) throw new AppError("Credenciales inválidas", 401);

    const passwordValido = await bcrypt.compare(datos.password, usuario.password);
    if (!passwordValido) throw new AppError("Credenciales inválidas", 401);

    if (!usuario.telefono_verificado) {
      throw new AppError("Debes verificar tu número de WhatsApp antes de iniciar sesión", 403);
    }

    const cafeteria = usuario.rol === "admin"
      ? await authRepository.buscarCafeteriaPorAdmin(usuario.id)
      : null;

    return {
      token:   generarToken(usuario),
      usuario: toPublico(usuario, cafeteria?.id),
    };
  },

  // ── Google OAuth ──────────────────────────────────────────────────────────
  async loginConGoogle(googleUser: {
    google_id:    string;
    nom_completo: string;
    email:        string;
    rol:          "cliente" | "admin";
  }): Promise<AuthResponse & { necesita_telefono: boolean }> {
    let usuario = await authRepository.buscarPorNombreUsuario(googleUser.email);

    if (!usuario) {
      usuario = await authRepository.upsertGoogle({
        nom_usuario:  googleUser.email,
        nom_completo: googleUser.nom_completo,
        num_telefono: "",
        rol:          googleUser.rol,
        google_id:    googleUser.google_id,
      });
    }

    const necesita_telefono = !usuario.telefono_verificado;

    return {
      token:           generarToken(usuario),
      usuario:         toPublico(usuario),
      necesita_telefono,
    };
  },

  // ── Reenviar OTP ──────────────────────────────────────────────────────────
  async reenviarOtp(usuario_id: string): Promise<{ mensaje: string }> {
    const usuario = await authRepository.buscarPorId(usuario_id);
    if (!usuario) throw new AppError("Usuario no encontrado", 404);
    if (usuario.telefono_verificado) throw new AppError("El teléfono ya está verificado", 400);

    await verificacionService.reenviarCodigo(usuario_id, usuario.num_telefono, usuario.nom_completo);
    return { mensaje: "Código reenviado por WhatsApp" };
  },
};
