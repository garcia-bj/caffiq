import { Router } from "express";
import { cafeteriasController } from "./cafeterias.controller";
import { sucursalesController } from "./sucursales.controller";
import { personalizacionesController } from "./personalizaciones.controller";
import { pedidosController } from "@modules/pedidos/interfaces/pedidos.controller";
import { authMiddleware } from "@shared/middlewares/auth.middleware";
import { roleMiddleware } from "@shared/middlewares/role.middleware";

const router = Router();

// GET /api/cafeterias
router.get("/", authMiddleware, cafeteriasController.listar);

// GET /api/cafeterias/:id
router.get("/:id", authMiddleware, cafeteriasController.obtener);

// PATCH /api/cafeterias/:id  — solo admin
router.patch("/:id", authMiddleware, roleMiddleware("admin"), cafeteriasController.actualizar);

// GET    /api/cafeterias/:cafeteria_id/sucursales   — cualquier usuario autenticado
router.get("/:cafeteria_id/sucursales", authMiddleware, sucursalesController.listar);

// POST   /api/cafeterias/:cafeteria_id/sucursales   — solo admin
router.post("/:cafeteria_id/sucursales", authMiddleware, roleMiddleware("admin"), sucursalesController.crear);

// PUT    /api/cafeterias/:cafeteria_id/sucursales/:id
router.put("/:cafeteria_id/sucursales/:id", authMiddleware, roleMiddleware("admin"), sucursalesController.modificar);

// PATCH  /api/cafeterias/:cafeteria_id/sucursales/:id/suspender
router.patch("/:cafeteria_id/sucursales/:id/suspender", authMiddleware, roleMiddleware("admin"), sucursalesController.suspender);

// ── Personalizaciones ────────────────────────────────────────────────────────

// GET  /api/cafeterias/:cafeteria_id/personalizaciones  — cliente y admin
router.get("/:cafeteria_id/personalizaciones", authMiddleware, personalizacionesController.listar);

// POST /api/cafeterias/:cafeteria_id/personalizaciones  — solo admin
router.post("/:cafeteria_id/personalizaciones", authMiddleware, roleMiddleware("admin"), personalizacionesController.crear);

// PUT  /api/cafeterias/:cafeteria_id/personalizaciones/:id
router.put("/:cafeteria_id/personalizaciones/:id", authMiddleware, roleMiddleware("admin"), personalizacionesController.actualizar);

// DELETE /api/cafeterias/:cafeteria_id/personalizaciones/:id
router.delete("/:cafeteria_id/personalizaciones/:id", authMiddleware, roleMiddleware("admin"), personalizacionesController.eliminar);

// POST /api/cafeterias/:cafeteria_id/personalizaciones/:id/opciones
router.post("/:cafeteria_id/personalizaciones/:id/opciones", authMiddleware, roleMiddleware("admin"), personalizacionesController.crearOpcion);

// PUT  /api/cafeterias/:cafeteria_id/personalizaciones/:id/opciones/:opcion_id
router.put("/:cafeteria_id/personalizaciones/:id/opciones/:opcion_id", authMiddleware, roleMiddleware("admin"), personalizacionesController.actualizarOpcion);

// DELETE /api/cafeterias/:cafeteria_id/personalizaciones/:id/opciones/:opcion_id
router.delete("/:cafeteria_id/personalizaciones/:id/opciones/:opcion_id", authMiddleware, roleMiddleware("admin"), personalizacionesController.eliminarOpcion);

// ── Pedidos por cafetería ────────────────────────────────────────────────────
// GET /api/cafeterias/:cafeteria_id/pedidos?estado=pendiente  — solo admin
router.get("/:cafeteria_id/pedidos", authMiddleware, roleMiddleware("admin"), pedidosController.listarPorCafeteria);

export default router;
