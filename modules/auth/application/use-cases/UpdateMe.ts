import { AppError } from "@shared/errors/AppError";
import type { IAuthRepository } from "../../domain/repositories/IAuthRepository";
import type { UsuarioEntity } from "../../domain/entities/Usuario";

export class UpdateMe {
  constructor(private readonly authRepo: IAuthRepository) {}

  async execute(
    usuario_id: string,
    datos: { nom_completo?: string; num_telefono?: string }
  ): Promise<UsuarioEntity> {
    if (!datos.nom_completo && !datos.num_telefono) {
      throw new AppError("Debes proporcionar al menos un campo para actualizar", 400);
    }

    if (datos.num_telefono) {
      const existe = await this.authRepo.existeTelefonoEnOtroUsuario(datos.num_telefono, usuario_id);
      if (existe) throw new AppError("Este numero de telefono ya esta registrado por otro usuario", 409);
    }

    return await this.authRepo.actualizarPerfil(usuario_id, datos);
  }
}
