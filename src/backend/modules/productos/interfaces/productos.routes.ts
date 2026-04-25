import { Router } from "express";
import { productosController } from "./productos.controller";
import { authMiddleware } from "@shared/middlewares/auth.middleware";
import { roleMiddleware } from "@shared/middlewares/role.middleware";

const router = Router({ mergeParams: true });

// GET  /api/cafeterias/:cafeteria_id/productos
router.get("/", authMiddleware, productosController.listar);

// POST /api/cafeterias/:cafeteria_id/productos  — solo admin
router.post("/", authMiddleware, roleMiddleware("admin"), productosController.crear);

export default router;
