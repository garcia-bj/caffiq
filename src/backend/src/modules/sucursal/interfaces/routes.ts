import { Router } from "express";
import { crearSucursal, listarSucursales } from "./sucursalController";

const router = Router();

router.post("/", crearSucursal);
router.get("/", listarSucursales);

export default router;