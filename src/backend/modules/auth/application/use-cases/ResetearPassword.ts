import bcrypt from "bcryptjs";
import { AppError } from "@shared/errors/AppError";
import type { IAuthRepository } from "../../domain/repositories/IAuthRepository";
import type { IVerificacionRepository } from "../../domain/repositories/IVerificacionRepository";

const SALT_ROUNDS = 12;

export class ResetearPassword {
  constructor(
    private readonly authRepo: IAuthRepository,
    private readonly verificacionRepo: IVerificacionRepository,
  ) {}

  async execute(usuario_id: string, codigo: string, nueva_password: string): Promise<{ mensaje: string }> {
    if (!nueva_password || nueva_password.length < 6) {
      throw new AppError("La contraseña debe tener al menos 6 caracteres", 400);
    }

    const usuario = await this.authRepo.buscarPorId(usuario_id);
    if (!usuario) throw new AppError("Usuario no encontrado", 404);

    const registro = await this.verificacionRepo.buscarValido(usuario_id, codigo);
    if (!registro) throw new AppError("Codigo invalido o expirado", 400);

    await this.verificacionRepo.marcarUsado(registro.id);

    const password_hash = await bcrypt.hash(nueva_password, SALT_ROUNDS);
    await this.authRepo.actualizarPassword(usuario_id, password_hash);

    return { mensaje: "Contraseña actualizada correctamente. Ya puedes iniciar sesion." };
  }
}
