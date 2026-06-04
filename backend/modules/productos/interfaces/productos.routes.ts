import { Router } from "express";
import { productosController } from "./productos.controller";
import { authMiddleware } from "@shared/middlewares/auth.middleware";
import { roleMiddleware } from "@shared/middlewares/role.middleware";

const router = Router({ mergeParams: true });

// GET  /api/cafeterias/:cafeteria_id/productos[?sucursal_id=xxx&todos=true]
router.get("/", authMiddleware, productosController.listar);

// POST /api/cafeterias/:cafeteria_id/productos  — solo admin
router.post("/", authMiddleware, roleMiddleware("admin"), productosController.crear);

// GET    /api/cafeterias/:cafeteria_id/productos/:producto_id
router.get("/:producto_id", authMiddleware, productosController.obtener);

// PUT    /api/cafeterias/:cafeteria_id/productos/:producto_id  — solo admin
router.put("/:producto_id", authMiddleware, roleMiddleware("admin"), productosController.modificar);

// PATCH  /api/cafeterias/:cafeteria_id/productos/:producto_id/suspender  — solo admin
router.patch("/:producto_id/suspender", authMiddleware, roleMiddleware("admin"), productosController.suspender);

export default router;
