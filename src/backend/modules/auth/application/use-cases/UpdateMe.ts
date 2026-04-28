import type { IAuthRepository } from "../../domain/repositories/IAuthRepository";
import type { UsuarioEntity } from "../../domain/entities/Usuario";

export class UpdateMe {
  constructor(private readonly authRepo: IAuthRepository) {}

  async execute(
    usuario_id: string,
    datos: { nom_completo?: string; num_telefono?: string }
  ): Promise<UsuarioEntity> {
    if (!datos.nom_completo && !datos.num_telefono) {
      throw new Error("Debes proporcionar al menos un campo para actualizar");
    }
    return await this.authRepo.actualizarPerfil(usuario_id, datos);
  }
}
