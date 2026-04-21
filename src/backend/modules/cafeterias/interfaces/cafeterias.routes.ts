import { Router } from "express";
import { cafeteriasController } from "./cafeterias.controller";
import { sucursalesController } from "./sucursales.controller";
import { authMiddleware } from "@shared/middlewares/auth.middleware";
import { roleMiddleware } from "@shared/middlewares/role.middleware";

const router = Router();

// GET /api/cafeterias
router.get("/", authMiddleware, cafeteriasController.listar);

// GET    /api/cafeterias/:cafeteria_id/sucursales   — cualquier usuario autenticado
router.get("/:cafeteria_id/sucursales", authMiddleware, sucursalesController.listar);

// POST   /api/cafeterias/:cafeteria_id/sucursales   — solo admin
router.post("/:cafeteria_id/sucursales", authMiddleware, roleMiddleware("admin"), sucursalesController.crear);

// PUT    /api/cafeterias/:cafeteria_id/sucursales/:id
router.put("/:cafeteria_id/sucursales/:id", authMiddleware, roleMiddleware("admin"), sucursalesController.modificar);

// PATCH  /api/cafeterias/:cafeteria_id/sucursales/:id/suspender
router.patch("/:cafeteria_id/sucursales/:id/suspender", authMiddleware, roleMiddleware("admin"), sucursalesController.suspender);

export default router;
