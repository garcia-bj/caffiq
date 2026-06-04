import { AppError } from "@shared/errors/AppError";
import type { IAuthRepository } from "../../domain/repositories/IAuthRepository";
import type { IVerificacionRepository } from "../../domain/repositories/IVerificacionRepository";

export class ResendOtp {
  constructor(
    private readonly authRepo: IAuthRepository,
    private readonly verificacionRepo: IVerificacionRepository,
    private readonly enviarWhatsApp: (telefono: string, codigo: string, nombre: string) => Promise<void>,
  ) {}

  async execute(usuario_id: string): Promise<{ mensaje: string }> {
    const usuario = await this.authRepo.buscarPorId(usuario_id);
    if (!usuario) throw new AppError("Usuario no encontrado", 404);
    if (usuario.telefono_verificado) throw new AppError("El teléfono ya está verificado", 400);

    const tieneReciente = await this.verificacionRepo.tieneCodigoReciente(usuario_id);
    if (tieneReciente) throw new AppError("Debes esperar 1 minuto antes de solicitar otro código", 429);

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expira_en = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await this.verificacionRepo.invalidarAnteriores(usuario_id);
    await this.verificacionRepo.guardar(usuario_id, usuario.num_telefono, codigo, expira_en);
    await this.enviarWhatsApp(usuario.num_telefono, codigo, usuario.nom_completo);

    return { mensaje: "Código reenviado por WhatsApp" };
  }
}
