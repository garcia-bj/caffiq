import type { Request, Response, NextFunction } from "express";
import { env } from "@config/env";
import { supabaseAdmin } from "@config/supabase";
import { AppError } from "@shared/errors/AppError";

import { SupabaseAuthRepository } from "../infrastructure/repositories/SupabaseAuthRepository";
import { SupabaseVerificacionRepository } from "../infrastructure/repositories/SupabaseVerificacionRepository";
import { enviarWhatsApp } from "../infrastructure/services/WhatsAppService";

import { RegisterUser } from "../application/use-cases/RegisterUser";
import { LoginUser, generarToken, toPublico } from "../application/use-cases/LoginUser";
import { VerifyPhone } from "../application/use-cases/VerifyPhone";
import { ResendOtp } from "../application/use-cases/ResendOtp";
import { GoogleLogin } from "../application/use-cases/GoogleLogin";
import { UpdateMe } from "../application/use-cases/UpdateMe";
import { SolicitarResetPassword } from "../application/use-cases/SolicitarResetPassword";
import { ResetearPassword } from "../application/use-cases/ResetearPassword";

// ── Composition root (no IoC container needed at this scale) ─────────────────
const authRepo         = new SupabaseAuthRepository();
const verificacionRepo = new SupabaseVerificacionRepository();

const registerUser         = new RegisterUser(authRepo, verificacionRepo, enviarWhatsApp);
const loginUser            = new LoginUser(authRepo);
const verifyPhone          = new VerifyPhone(authRepo, verificacionRepo);
const resendOtp            = new ResendOtp(authRepo, verificacionRepo, enviarWhatsApp);
const googleLogin          = new GoogleLogin(authRepo);
const updateMe             = new UpdateMe(authRepo);
const solicitarResetPassword = new SolicitarResetPassword(authRepo, verificacionRepo, enviarWhatsApp);
const resetearPassword     = new ResetearPassword(authRepo, verificacionRepo);

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
    } catch (err: any) {
      // Si el teléfono no está verificado, devolver usuario_id para que el frontend
      // pueda navegar directamente a la pantalla de verificación
      if (err.statusCode === 403 && err.message?.includes("verificar")) {
        const usuario = await authRepo.buscarPorNombreUsuario(req.body.nom_usuario).catch(() => null);
        if (usuario) {
          return res.status(403).json({
            mensaje:      err.message,
            code:         "PHONE_NOT_VERIFIED",
            usuario_id:   usuario.id,
            num_telefono: usuario.num_telefono,
          });
        }
      }
      next(err);
    }
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

  // POST /api/auth/google/token — verifica el access_token de Supabase y emite JWT de Caffiq
  async googleToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { access_token, rol } = req.body as { access_token?: string; rol?: string };
      if (!access_token) throw new AppError("access_token requerido", 400);
      if (!rol || !["cliente", "admin"].includes(rol)) throw new AppError("Rol invalido", 400);

      const { data, error } = await supabaseAdmin.auth.getUser(access_token);
      if (error || !data.user) throw new AppError("Token de Google invalido o expirado", 401);

      const googleUser = data.user;
      const resultado = await googleLogin.execute({
        google_id:    googleUser.id,
        nom_completo: googleUser.user_metadata?.full_name ?? googleUser.email ?? "",
        email:        googleUser.email ?? "",
        rol:          rol as "cliente" | "admin",
      });

      res.status(200).json(resultado);
    } catch (err) { next(err); }
  },

  // GET /api/auth/google/relay — recibe el code de Supabase y lo reenvía a la app via deep link
  async googleRelay(req: Request, res: Response, next: NextFunction) {
    try {
      const code   = req.query.code as string | undefined;
      const expRaw = req.query.exp  as string | undefined;

      if (!code) {
        const msg = (req.query.error_description as string) ?? "Codigo de autorizacion no recibido";
        throw new AppError(msg, 400);
      }

      const appUrl = decodeURIComponent(expRaw ?? "caffiq://auth/callback");
      const params = new URLSearchParams({ code });
      res.redirect(`${appUrl}?${params.toString()}`);
    } catch (err) { next(err); }
  },

  // GET /api/auth/google?rol=cliente|admin&platform=mobile&scheme=caffiq
  async googleRedirect(req: Request, res: Response, next: NextFunction) {
    try {
      const rol = (req.query.rol as string) ?? "cliente";
      const platform = req.query.platform as string | undefined;
      const scheme = req.query.scheme as string | undefined;
      if (!["cliente", "admin"].includes(rol)) throw new AppError("Rol invalido", 400);
      const params = new URLSearchParams({ rol });
      if (platform) params.set("platform", platform);
      if (scheme) params.set("scheme", scheme);
      const { data, error } = await supabaseAdmin.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${env.google.redirectUrl}?${params.toString()}`,
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
      const platform = req.query.platform as string | undefined;
      const appScheme = (req.query.scheme as string) || "caffiq";
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
      if (platform === "mobile") {
        const redirectParams = new URLSearchParams({
          token: resultado.token,
          usuario: JSON.stringify(resultado.usuario),
          necesita_telefono: String(resultado.necesita_telefono),
        });
        res.redirect(`${appScheme}://auth/callback?${redirectParams.toString()}`);
      } else {
        res.status(200).json(resultado);
      }
    } catch (err) { next(err); }
  },

  // GET /api/auth/me
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({ usuario: req.user });
    } catch (err) { next(err); }
  },

  // POST /api/auth/setup-cafeteria — solo admin Google sin cafetería
  async setupCafeteria(req: Request, res: Response, next: NextFunction) {
    try {
      const admin_id = req.user!.id;
      if (req.user!.rol !== "admin") throw new AppError("Solo administradores", 403);

      const { nom_cafeteria, ciudad, descripcion } = req.body;
      if (!nom_cafeteria?.trim()) throw new AppError("El nombre de la cafetería es requerido", 400);
      if (!ciudad?.trim())        throw new AppError("La ciudad es requerida", 400);

      const existing = await authRepo.buscarCafeteriaPorAdmin(admin_id);
      if (existing) throw new AppError("Ya tienes una cafetería registrada", 400);

      const admin     = await authRepo.buscarPorId(admin_id);
      if (!admin) throw new AppError("Usuario no encontrado", 404);

      const cafeteria = await authRepo.crearCafeteria(admin_id, {
        nom_cafeteria: nom_cafeteria.trim(),
        ciudad:        ciudad.trim(),
        descripcion:   descripcion?.trim() ?? undefined,
      });

      res.status(201).json({
        token:   generarToken(admin),
        usuario: toPublico(admin, cafeteria.id),
      });
    } catch (err) { next(err); }
  },

  // PATCH /api/auth/push-token  — token: string activa, token: null desactiva
  async savePushToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      if (token !== null && typeof token !== "string") throw new AppError("token debe ser string o null", 400);
      await authRepo.guardarPushToken(req.user!.id, token ?? null);
      res.status(200).json({ ok: true });
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

  // POST /api/auth/forgot-password
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) throw new AppError("El correo electronico es requerido", 400);
      const resultado = await solicitarResetPassword.execute(email);
      res.status(200).json(resultado);
    } catch (err) { next(err); }
  },

  // POST /api/auth/reset-password
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { usuario_id, codigo, nueva_password } = req.body;
      if (!usuario_id || !codigo || !nueva_password) {
        throw new AppError("usuario_id, codigo y nueva_password son requeridos", 400);
      }
      const resultado = await resetearPassword.execute(usuario_id, codigo, nueva_password);
      res.status(200).json(resultado);
    } catch (err) { next(err); }
  },
};
