import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "@config/env";
import { AppError } from "@shared/errors/AppError";
import type { IAuthRepository } from "../../domain/repositories/IAuthRepository";
import type { UsuarioEntity } from "../../domain/entities/Usuario";

export interface LoginInput {
  nom_usuario: string;
  password: string;
}

export interface UsuarioPublico {
  id: string;
  nom_usuario: string;
  nom_completo: string;
  num_telefono: string;
  rol: string;
  telefono_verificado: boolean;
  created_at: string;
  cafeteria_id?: string;
}

export interface AuthOutput {
  token: string;
  usuario: UsuarioPublico;
}

export const generarToken = (usuario: UsuarioEntity): string =>
  jwt.sign(
    { id: usuario.id, rol: usuario.rol },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn } as jwt.SignOptions
  );

export const toPublico = (u: UsuarioEntity, cafeteria_id?: string): UsuarioPublico => ({
  id: u.id,
  nom_usuario: u.nom_usuario,
  nom_completo: u.nom_completo,
  num_telefono: u.num_telefono,
  rol: u.rol,
  telefono_verificado: u.telefono_verificado,
  created_at: u.created_at,
  ...(cafeteria_id && { cafeteria_id }),
});

export class LoginUser {
  constructor(private readonly authRepo: IAuthRepository) {}

  async execute(input: LoginInput): Promise<AuthOutput> {
    const usuario = await this.authRepo.buscarPorNombreUsuario(input.nom_usuario);
    if (!usuario) throw new AppError("Credenciales inválidas", 401);

    const passwordValido = await bcrypt.compare(input.password, usuario.password);
    if (!passwordValido) throw new AppError("Credenciales inválidas", 401);

    if (!usuario.telefono_verificado) {
      throw new AppError("Debes verificar tu número de WhatsApp antes de iniciar sesión", 403);
    }

    const cafeteria = usuario.rol === "admin"
      ? await this.authRepo.buscarCafeteriaPorAdmin(usuario.id)
      : null;

    return {
      token: generarToken(usuario),
      usuario: toPublico(usuario, cafeteria?.id),
    };
  }
}
