import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "@config/env";
import { AppError } from "@shared/errors/AppError";
import { authRepository } from "@modules/auth/auth.repository";

interface JwtPayload {
  id: string;
  rol: string;
}

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      throw new AppError("Token de autorizacion requerido", 401);
    }

    const token = header.split(" ")[1];
    const payload = jwt.verify(token, env.jwt.secret) as JwtPayload;

    const usuario = await authRepository.buscarPorId(payload.id);
    if (!usuario) throw new AppError("Usuario no encontrado", 401);

    // Inyectar usuario en la request para uso posterior
    req.user = {
      id: usuario.id,
      nom_usuario: usuario.nom_usuario,
      nom_completo: usuario.nom_completo,
      num_telefono: usuario.num_telefono,
      rol: usuario.rol,
      telefono_verificado: usuario.telefono_verificado,
      created_at: usuario.created_at,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      next(new AppError("Token invalido o expirado", 401));
    } else {
      next(err);
    }
  }
};
