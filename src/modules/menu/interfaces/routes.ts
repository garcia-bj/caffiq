import { Router } from "express";
import {
  agregarProducto,
  listarProductos,
  modificarProducto,
  suspenderProducto,
  obtenerProducto,
} from "./menuController";

const router = Router();

router.get("/", listarProductos);              // ← primero
router.post("/", agregarProducto);
router.get("/:id", obtenerProducto);           // ← después
router.put("/:id/editar", modificarProducto);
router.patch("/:id/suspender", suspenderProducto);

export default router;