import type { Request, Response, NextFunction } from "express";
import { env } from "@config/env";
import { supabaseAdmin } from "@config/supabase";
import { AppError } from "@shared/errors/AppError";

import { SupabaseAuthRepository } from "../infrastructure/repositories/SupabaseAuthRepository";
import { SupabaseVerificacionRepository } from "../infrastructure/repositories/SupabaseVerificacionRepository";
import { enviarWhatsApp } from "../infrastructure/services/WhatsAppService";

import { RegisterUser } from "../application/use-cases/RegisterUser";
import { LoginUser } from "../application/use-cases/LoginUser";
import { VerifyPhone } from "../application/use-cases/VerifyPhone";
import { ResendOtp } from "../application/use-cases/ResendOtp";
import { GoogleLogin } from "../application/use-cases/GoogleLogin";
import { UpdateMe } from "../application/use-cases/UpdateMe";

// ── Composition root (no IoC container needed at this scale) ─────────────────
const authRepo         = new SupabaseAuthRepository();
const verificacionRepo = new SupabaseVerificacionRepository();

const registerUser = new RegisterUser(authRepo, verificacionRepo, enviarWhatsApp);
const loginUser    = new LoginUser(authRepo);
const verifyPhone  = new VerifyPhone(authRepo, verificacionRepo);
const resendOtp    = new ResendOtp(authRepo, verificacionRepo, enviarWhatsApp);
const googleLogin  = new GoogleLogin(authRepo);
const updateMe     = new UpdateMe(authRepo);

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
      const resultado = await registerUser.execute({ nom_usuario, nom_completo, num_telefono, password, rol, cafeteria });
      res.status(201).json(resultado);
    } catch (err) { next(err); }
  },

  // POST /api/auth/verify-phone
  async verifyPhone(req: Request, res: Response, next: NextFunction) {
    try {
      const { usuario_id, codigo } = req.body;
      if (!usuario_id || !codigo) throw new AppError("usuario_id y codigo son requeridos", 400);
      const resultado = await verifyPhone.execute(usuario_id, codigo);
      res.status(200).json(resultado);
    } catch (err) { next(err); }
  },

  // POST /api/auth/login
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { nom_usuario, password } = req.body;
      if (!nom_usuario || !password) throw new AppError("nom_usuario y password son requeridos", 400);
      const resultado = await loginUser.execute({ nom_usuario, password });
      res.status(200).json(resultado);
    } catch (err) { next(err); }
  },

  // POST /api/auth/resend-otp
  async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { usuario_id } = req.body;
      if (!usuario_id) throw new AppError("usuario_id es requerido", 400);
      const resultado = await resendOtp.execute(usuario_id);
      res.status(200).json(resultado);
    } catch (err) { next(err); }
  },

  // GET /api/auth/google?rol=cliente|admin
  async googleRedirect(req: Request, res: Response, next: NextFunction) {
    try {
      const rol = (req.query.rol as string) ?? "cliente";
      if (!["cliente", "admin"].includes(rol)) throw new AppError("Rol invalido", 400);
      const { data, error } = await supabaseAdmin.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${env.google.redirectUrl}?rol=${rol}`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error || !data.url) throw new AppError("Error iniciando OAuth con Google", 500);
      res.redirect(data.url);
    } catch (err) { next(err); }
  },

  // GET /api/auth/google/callback
  async googleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, rol } = req.query as { code: string; rol: string };
      if (!code) throw new AppError("Codigo de autorizacion no recibido", 400);
      const { data: sessionData, error } = await supabaseAdmin.auth.exchangeCodeForSession(code);
      if (error || !sessionData.user) throw new AppError("Error al autenticar con Google", 401);
      const googleUser = sessionData.user;
      const resultado = await googleLogin.execute({
        google_id:    googleUser.id,
        nom_completo: googleUser.user_metadata?.full_name ?? googleUser.email ?? "",
        email:        googleUser.email ?? "",
        rol:          (rol as "cliente" | "admin") ?? "cliente",
      });
      res.status(200).json(resultado);
    } catch (err) { next(err); }
  },

  // GET /api/auth/me
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({ usuario: req.user });
    } catch (err) { next(err); }
  },

  // PATCH /api/auth/me
  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const { nom_completo, num_telefono } = req.body;
      if (!nom_completo && !num_telefono) {
        throw new AppError("Debes enviar al menos un campo para actualizar", 400);
      }
      const usuarioId = req.user!.id;
      const usuario = await updateMe.execute(usuarioId, { nom_completo, num_telefono });
      // Excluir password del resultado
      const { password: _, ...usuarioPublico } = usuario as any;
      res.status(200).json({ usuario: usuarioPublico });
    } catch (err) { next(err); }
  },
};
