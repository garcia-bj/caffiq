
import { Request, Response } from "express";
import {
  crearSucursal as crearSucursalService,
  listarSucursales as listarSucursalesService,
} from "../application/sucursalService";
import { suspenderSucursal } from "../application/SuspenderSucursal";
import { modificarSucursal } from "../application/ModificarSucursal";

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

export const suspenderSucursalController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const role = req.headers.role as string;;

    if (role !== "admin") {
      return res.status(403).json({ error: "No autorizado" });
    }

    const result = await suspenderSucursal(id);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      message: "Sucursal suspendida correctamente ✅",
      data: result.data,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const modificarSucursalController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const role = Array.isArray(req.headers.role)
      ? req.headers.role[0]
      : req.headers.role;

    if (role !== "admin") {
      return res.status(403).json({ error: "No autorizado" });
    }

    const { nombre, direccion, imagen } = req.body;

    if (!nombre || !direccion || !imagen) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const result = await modificarSucursal(id, { nombre, direccion, imagen });

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      message: "Sucursal actualizada correctamente ✅",
      data: result.data,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};