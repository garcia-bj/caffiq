import { Router } from "express";
import { pedidosController } from "./pedidos.controller";
import { authMiddleware } from "@shared/middlewares/auth.middleware";
import { roleMiddleware } from "@shared/middlewares/role.middleware";

const router = Router();

// POST /api/pedidos  — cliente crea pedido
router.post("/", authMiddleware, pedidosController.crear);

// GET  /api/pedidos/mis-pedidos  — cliente ve sus pedidos
router.get("/mis-pedidos", authMiddleware, pedidosController.misPedidos);

// PATCH /api/pedidos/:id/estado  — admin aprueba o rechaza
router.patch("/:id/estado", authMiddleware, roleMiddleware("admin"), pedidosController.actualizarEstado);

export default router;
