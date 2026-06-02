import { Router } from "express";
import { authController } from "./auth.controller";
import { authMiddleware } from "@shared/middlewares/auth.middleware";

const router = Router();

router.post("/register",     authController.register);
router.post("/verify-phone", authController.verifyPhone);
router.post("/resend-otp",   authController.resendOtp);
router.post("/login",         authController.login);
router.post("/google/token",  authController.googleToken);
router.get("/google/relay",   authController.googleRelay);
router.get("/google",         authController.googleRedirect);
router.get("/google/callback", authController.googleCallback);
router.get("/me",           authMiddleware, authController.me);
router.patch("/me",         authMiddleware, authController.updateMe);
router.patch("/push-token",      authMiddleware, authController.savePushToken);
router.post("/setup-cafeteria",  authMiddleware, authController.setupCafeteria);
router.post("/forgot-password",  authController.forgotPassword);
router.post("/reset-password",   authController.resetPassword);

export default router;
