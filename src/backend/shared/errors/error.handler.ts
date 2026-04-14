import type { Request, Response, NextFunction } from "express";
import { AppError } from "./AppError";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      ok: false,
      mensaje: err.message,
    });
    return;
  }

  // Error inesperado — no exponer detalles al cliente
  console.error("[ERROR NO CONTROLADO]", err);
  res.status(500).json({
    ok: false,
    mensaje: "Error interno del servidor",
  });
};
