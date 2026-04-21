import { Router } from "express";
import { crearSucursal, listarSucursales, suspenderSucursalController, modificarSucursalController } from "./sucursalController";

const router = Router();

router.post("/", crearSucursal);
router.get("/", listarSucursales);
router.patch("/:id/suspender", suspenderSucursalController);
router.put("/:id/editar", modificarSucursalController);

export default router;