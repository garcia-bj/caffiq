import { Router } from "express";
import { cafeteriasController } from "./cafeterias.controller";
import { authMiddleware } from "@shared/middlewares/auth.middleware";

const router = Router();

// GET /api/cafeterias
router.get("/", authMiddleware, cafeteriasController.listar);

// GET /api/cafeterias/:id/sucursales
router.get("/:id/sucursales", authMiddleware, cafeteriasController.sucursales);

export default router;
