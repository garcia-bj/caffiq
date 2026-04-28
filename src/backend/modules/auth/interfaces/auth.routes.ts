import { Router } from "express";
import { authController } from "./auth.controller";
import { authMiddleware } from "@shared/middlewares/auth.middleware";

const router = Router();

router.post("/register",     authController.register);
router.post("/verify-phone", authController.verifyPhone);
router.post("/resend-otp",   authController.resendOtp);
router.post("/login",        authController.login);
router.get("/google",        authController.googleRedirect);
router.get("/google/callback", authController.googleCallback);
router.get("/me",  authMiddleware, authController.me);
router.patch("/me", authMiddleware, authController.updateMe);

export default router;
