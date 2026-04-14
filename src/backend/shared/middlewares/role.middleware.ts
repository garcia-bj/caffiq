import type { Request, Response, NextFunction } from "express";
import { AppError } from "@shared/errors/AppError";
import type { Rol } from "@modules/auth/auth.dto";

// Uso: router.get("/ruta", authMiddleware, requireRol("admin"), handler)
export const requireRol = (...roles: Rol[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError("No autenticado", 401));
    }
    if (!roles.includes(req.user.rol as Rol)) {
      return next(new AppError("No tienes permiso para esta accion", 403));
    }
    next();
  };
};
