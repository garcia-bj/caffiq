
import { Request, Response } from "express";
import {
  crearSucursal as crearSucursalService,
  listarSucursales as listarSucursalesService,
} from "../application/sucursalService";

export const crearSucursal = async (req: Request, res: Response) => {
  const data = req.body;
  console.log("📥 BODY RECIBIDO:", req.body); // 👈 agrega esto
  const result = await crearSucursalService(data);

  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  return res.json({ data: result.data });
};

export const listarSucursales = async (req: Request, res: Response) => {
  const result = await listarSucursalesService();

  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  return res.json({ data: result.data });
};