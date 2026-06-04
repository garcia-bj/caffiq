// backend/src/modules/sucursal/interfaces/sucursalController.ts
import { Request, Response } from "express";
import {
  crearSucursal as crearSucursalService,
  listarSucursales as listarSucursalesService,
  listarTodasSucursalesSinFiltro as listarTodasService
} from "../application/sucursalService";
import { suspenderSucursal } from "../application/SuspenderSucursal";
import { modificarSucursal } from "../application/ModificarSucursal";
import { obtenerTodasLasSucursales } from "../infrastructure/sucursalRepository";

export const listarSucursales = async (req: Request, res: Response) => {
  try {
    const sucursales = await obtenerTodasLasSucursales();
    res.status(200).json(sucursales);
  } catch (error: any) {
    res.status(500).json({
      error: "No se pudieron obtener las sucursales",
      detalle: error.message
    });
  }
};

export const listarTodasSucursales = async (req: Request, res: Response) => {
  try {
    const sucursales = await listarTodasService();
    res.status(200).json(sucursales);
  } catch (error: any) {
    res.status(500).json({ error: "No se pudieron obtener las sucursales", detalle: error.message });
  }
};

export const crearSucursal = async (req: Request, res: Response) => {
  try {
    const { nombre, direccion, imagen_url, activa } = req.body;

    if (!nombre || !direccion) {
      return res.status(400).json({ error: "Nombre y dirección son obligatorios" });
    }

    const result = await crearSucursalService({
      nombre,
      direccion,
      imagen_url: imagen_url || null,
      activa: activa ?? true,
    });

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({
      message: "Sucursal creada correctamente ✅",
      data: result.data,
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const suspenderSucursalController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const role = req.headers.role as string;

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

    const { nombre, direccion, imagen_url, activa } = req.body;

    if (!nombre || !direccion || !imagen_url) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const result = await modificarSucursal(id, { nombre, direccion, imagen_url, activa });

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
