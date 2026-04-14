import type { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";
import { env } from "@config/env";
import { supabaseAdmin } from "@config/supabase";
import { AppError } from "@shared/errors/AppError";

export const authController = {

  // POST /api/auth/register
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { nom_usuario, nom_completo, num_telefono, password, rol, cafeteria } = req.body;

      if (!nom_usuario || !nom_completo || !num_telefono || !password || !rol) {
        throw new AppError("Todos los campos son requeridos", 400);
      }
      if (!["cliente", "admin"].includes(rol)) {
        throw new AppError("El rol debe ser 'cliente' o 'admin'", 400);
      }

      const resultado = await authService.registrar({ nom_usuario, nom_completo, num_telefono, password, rol, cafeteria });
      res.status(201).json(resultado);
    } catch (err) {
      next(err);
    }
  },

  // POST /api/auth/verify-phone
  async verifyPhone(req: Request, res: Response, next: NextFunction) {
    try {
      const { usuario_id, codigo } = req.body;

      if (!usuario_id || !codigo) {
        throw new AppError("usuario_id y codigo son requeridos", 400);
      }

      const resultado = await authService.verificarTelefono(usuario_id, codigo);
      res.status(200).json(resultado);
    } catch (err) {
      next(err);
    }
  },

  // POST /api/auth/login
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { nom_usuario, password } = req.body;

      if (!nom_usuario || !password) {
        throw new AppError("nom_usuario y password son requeridos", 400);
      }

      const resultado = await authService.login({ nom_usuario, password });
      res.status(200).json(resultado);
    } catch (err) {
      next(err);
    }
  },

  // POST /api/auth/resend-otp
  async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { usuario_id } = req.body;
      if (!usuario_id) throw new AppError("usuario_id es requerido", 400);

      const resultado = await authService.reenviarOtp(usuario_id);
      res.status(200).json(resultado);
    } catch (err) {
      next(err);
    }
  },

  // GET /api/auth/google?rol=cliente|admin
  async googleRedirect(req: Request, res: Response, next: NextFunction) {
    try {
      const rol = (req.query.rol as string) ?? "cliente";
      if (!["cliente", "admin"].includes(rol)) {
        throw new AppError("Rol invalido", 400);
      }

      const { data, error } = await supabaseAdmin.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${env.google.redirectUrl}?rol=${rol}`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });

      if (error || !data.url) throw new AppError("Error iniciando OAuth con Google", 500);
      res.redirect(data.url);
    } catch (err) {
      next(err);
    }
  },

  // GET /api/auth/google/callback
  async googleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, rol } = req.query as { code: string; rol: string };

      if (!code) throw new AppError("Codigo de autorizacion no recibido", 400);

      // Intercambiar el code por una sesion de Supabase
      const { data: sessionData, error } = await supabaseAdmin.auth.exchangeCodeForSession(code);
      if (error || !sessionData.user) throw new AppError("Error al autenticar con Google", 401);

      const googleUser = sessionData.user;
      const resultado = await authService.loginConGoogle({
        google_id: googleUser.id,
        nom_completo: googleUser.user_metadata?.full_name ?? googleUser.email ?? "",
        email: googleUser.email ?? "",
        rol: (rol as "cliente" | "admin") ?? "cliente",
      });

      res.status(200).json(resultado);
    } catch (err) {
      next(err);
    }
  },

  // GET /api/auth/me  (requiere token JWT)
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({ usuario: req.user });
    } catch (err) {
      next(err);
    }
  },
};
