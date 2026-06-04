import { AppError } from "@shared/errors/AppError";
import type { IAuthRepository } from "../../domain/repositories/IAuthRepository";
import type { IVerificacionRepository } from "../../domain/repositories/IVerificacionRepository";
import { generarToken, toPublico } from "./LoginUser";
import type { AuthOutput } from "./LoginUser";

export class VerifyPhone {
  constructor(
    private readonly authRepo: IAuthRepository,
    private readonly verificacionRepo: IVerificacionRepository,
  ) {}

  async execute(usuario_id: string, codigo: string): Promise<AuthOutput> {
    const usuario = await this.authRepo.buscarPorId(usuario_id);
    if (!usuario) throw new AppError("Usuario no encontrado", 404);
    if (usuario.telefono_verificado) throw new AppError("El teléfono ya estaba verificado", 400);

    const registro = await this.verificacionRepo.buscarValido(usuario_id, codigo);
    if (!registro) throw new AppError("Código inválido o expirado", 400);
    await this.verificacionRepo.marcarUsado(registro.id);
    await this.authRepo.marcarTelefonoVerificado(usuario_id);

    const usuarioVerificado = { ...usuario, telefono_verificado: true };
    const cafeteria = usuario.rol === "admin"
      ? await this.authRepo.buscarCafeteriaPorAdmin(usuario_id)
      : null;

    return {
      token: generarToken(usuarioVerificado),
      usuario: toPublico(usuarioVerificado, cafeteria?.id),
    };
  }
}
