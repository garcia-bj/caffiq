import bcrypt from "bcryptjs";
import { AppError } from "@shared/errors/AppError";
import type { IAuthRepository, CafeteriaData } from "../../domain/repositories/IAuthRepository";
import type { IVerificacionRepository } from "../../domain/repositories/IVerificacionRepository";
import type { Rol } from "../../domain/entities/Usuario";

const SALT_ROUNDS = 12;

export interface RegisterInput {
  nom_usuario: string;
  nom_completo: string;
  num_telefono: string;
  password: string;
  rol: Rol;
  cafeteria?: CafeteriaData;
}

export interface RegisterOutput {
  mensaje: string;
  usuario_id: string;
}

export class RegisterUser {
  constructor(
    private readonly authRepo: IAuthRepository,
    private readonly verificacionRepo: IVerificacionRepository,
    private readonly enviarWhatsApp: (telefono: string, codigo: string, nombre: string) => Promise<void>,
  ) {}

  async execute(input: RegisterInput): Promise<RegisterOutput> {
    input.nom_usuario = input.nom_usuario.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.nom_usuario)) {
      throw new AppError("nom_usuario debe ser un correo electrónico válido", 400);
    }

    if (input.rol === "admin" && !input.cafeteria) {
      throw new AppError("Los datos de la cafetería son requeridos para administradores", 400);
    }

    const existe = await this.authRepo.existeNombreOTelefono(input.nom_usuario, input.num_telefono);
    if (existe) throw new AppError("El nombre de usuario o número de teléfono ya está registrado", 409);

    const password_hash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const usuario = await this.authRepo.crear({
      nom_usuario: input.nom_usuario,
      nom_completo: input.nom_completo,
      num_telefono: input.num_telefono,
      password_hash,
      rol: input.rol,
    });

    if (input.rol === "admin" && input.cafeteria) {
      await this.authRepo.crearCafeteria(usuario.id, input.cafeteria);
    }

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expira_en = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await this.verificacionRepo.invalidarAnteriores(usuario.id);
    await this.verificacionRepo.guardar(usuario.id, input.num_telefono, codigo, expira_en);
    await this.enviarWhatsApp(input.num_telefono, codigo, input.nom_completo);

    return {
      mensaje: "Cuenta creada. Verifica tu número de WhatsApp con el código enviado.",
      usuario_id: usuario.id,
    };
  }
}
