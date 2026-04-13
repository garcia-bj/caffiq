import { Router } from "express";
import { crearSucursal, listarSucursales } from "../application/sucursalService";

const router = Router();

router.get("/", listarSucursales);
router.post("/", crearSucursal);

export default router;