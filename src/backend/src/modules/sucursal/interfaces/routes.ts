import { Router } from "express";
import { crearSucursal, listarSucursales, suspenderSucursalController, listarTodasSucursales, modificarSucursalController } from "./sucursalController";

const router = Router();

router.post("/", crearSucursal);
router.get("/", listarSucursales);
router.patch("/:id/suspender", suspenderSucursalController);
router.put("/:id/editar", modificarSucursalController);
router.get("/todas", listarTodasSucursales); 

export default router;