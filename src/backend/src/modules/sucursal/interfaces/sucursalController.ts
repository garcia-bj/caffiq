import { Request, Response } from "express";
import {
  crearSucursal,
  listarSucursales,
} from "../application/sucursalService";

export const crearSucursalController = async (req: Request, res: Response) => {
  const result = await crearSucursal(req.body);
  res.json(result);
};

export const listarSucursalesController = async (req: Request, res: Response) => {
  const result = await listarSucursales();
  res.json(result);
};