// backend/src/modules/sucursal/interfaces/sucursalController.ts
import { Request, Response } from "express";
import { obtenerTodasLasSucursales } from "../infrastructure/sucursalRepository";

// Esta es la función que responde al GET que definiste en tus rutas
export const listarSucursales = async (req: Request, res: Response) => {
  try {
    // Llamamos al repositorio que busca en Supabase
    const sucursales = await obtenerTodasLasSucursales();

    // Respondemos al Frontend con un código 200 (Éxito) y los datos en JSON
    res.status(200).json(sucursales);
  } catch (error: any) {
    // Si algo falla, respondemos con código 500 (Error de servidor)
    res.status(500).json({ 
      error: "No se pudieron obtener las sucursales",
      detalle: error.message 
    });
  }
};

// Dejamos la función para el POST lista (aunque esté vacía por ahora)
export const crearSucursal = async (req: Request, res: Response) => {
  try {
    // Aquí iría la lógica para insertar en la base de datos
    res.status(501).json({ message: "La creación de sucursales se implementará pronto" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
