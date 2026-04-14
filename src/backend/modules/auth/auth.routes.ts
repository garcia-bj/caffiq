import { Router } from "express";
import { authController } from "./auth.controller";
import { authMiddleware } from "@shared/middlewares/auth.middleware";

const router = Router();

// ── Registro y verificacion ───────────────────────────────────────────────────
// POST   /api/auth/register        — Crear cuenta (email + password)
router.post("/register", authController.register);

// POST   /api/auth/verify-phone    — Verificar OTP de telefono
router.post("/verify-phone", authController.verifyPhone);

// POST   /api/auth/resend-otp      — Reenviar codigo (rate limit: 1/min)
router.post("/resend-otp", authController.resendOtp);

// ── Login ────────────────────────────────────────────────────────────────────
// POST   /api/auth/login           — Login con nom_usuario + password
router.post("/login", authController.login);

// ── Google OAuth ─────────────────────────────────────────────────────────────
// GET    /api/auth/google?rol=     — Inicia flujo OAuth
router.get("/google", authController.googleRedirect);

// GET    /api/auth/google/callback — Callback de Google
router.get("/google/callback", authController.googleCallback);

// ── Sesion actual ────────────────────────────────────────────────────────────
// GET    /api/auth/me              — Retorna el usuario autenticado
router.get("/me", authMiddleware, authController.me);

export default router;
