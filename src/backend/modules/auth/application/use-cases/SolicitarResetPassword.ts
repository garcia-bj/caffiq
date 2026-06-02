import { AppError } from "@shared/errors/AppError";
import type { IAuthRepository } from "../../domain/repositories/IAuthRepository";
import type { IVerificacionRepository } from "../../domain/repositories/IVerificacionRepository";

export class SolicitarResetPassword {
  constructor(
    private readonly authRepo: IAuthRepository,
    private readonly verificacionRepo: IVerificacionRepository,
    private readonly enviarWhatsApp: (telefono: string, codigo: string, nombre: string) => Promise<void>,
  ) {}

  async execute(email: string): Promise<{ mensaje: string; usuario_id: string }> {
    email = email.trim().toLowerCase();

    const usuario = await this.authRepo.buscarPorNombreUsuario(email);
    if (!usuario) throw new AppError("Si el correo esta registrado, recibiras un codigo de recuperacion", 200);

    const tieneReciente = await this.verificacionRepo.tieneCodigoReciente(usuario.id);
    if (tieneReciente) throw new AppError("Debes esperar 1 minuto antes de solicitar otro codigo", 429);

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expira_en = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await this.verificacionRepo.invalidarAnteriores(usuario.id);
    await this.verificacionRepo.guardar(usuario.id, usuario.num_telefono, codigo, expira_en);
    await this.enviarWhatsApp(usuario.num_telefono, codigo, usuario.nom_completo);

    return {
      mensaje: "Si el correo esta registrado, recibiras un codigo de recuperacion por WhatsApp.",
      usuario_id: usuario.id,
    };
  }
}
