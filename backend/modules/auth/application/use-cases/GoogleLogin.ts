import type { IAuthRepository } from "../../domain/repositories/IAuthRepository";
import { generarToken, toPublico } from "./LoginUser";
import type { Rol } from "../../domain/entities/Usuario";

export interface GoogleLoginInput {
  google_id: string;
  nom_completo: string;
  email: string;
  rol: Rol;
}

export interface GoogleLoginOutput {
  token: string;
  usuario: ReturnType<typeof toPublico>;
  necesita_telefono: boolean;
}

export class GoogleLogin {
  constructor(private readonly authRepo: IAuthRepository) {}

  async execute(input: GoogleLoginInput): Promise<GoogleLoginOutput> {
    input.email = input.email.trim().toLowerCase();

    let usuario = await this.authRepo.buscarPorNombreUsuario(input.email);

    if (!usuario) {
      usuario = await this.authRepo.upsertGoogle({
        nom_usuario: input.email,
        nom_completo: input.nom_completo,
        num_telefono: "",
        rol: input.rol,
        google_id: input.google_id,
      });
    } else if (!usuario.google_id) {
      await this.authRepo.vincularGoogleId(usuario.id, input.google_id);
    }

    return {
      token: generarToken(usuario),
      usuario: toPublico(usuario),
      necesita_telefono: !usuario.telefono_verificado,
    };
  }
}
