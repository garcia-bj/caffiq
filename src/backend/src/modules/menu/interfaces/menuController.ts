import { Request, Response } from "express";
import {
  crearProducto,
  listarProductosPorSucursal,
  listarTodosLosProductos,
  listarTodosProductosPorSucursal,
} from "../application/menuService";
import { modificarProductoDB, suspenderProductoDB, obtenerProductoPorId } from "../infrastructure/menuRepository";
import { supabase } from "../../../../supabase";

export const agregarProducto = async (req: Request, res: Response) => {
  try {
    const { id_sucursal, nom_producto, descripcion, precio, stock, imagen_producto } = req.body;

    if (!id_sucursal || !nom_producto || !precio) {
      return res.status(400).json({ error: "id_sucursal, nom_producto y precio son obligatorios" });
    }
    const stockNum = stock ? parseInt(stock) : 0;
    const result = await crearProducto(
      {
        nom_producto,
        descripcion: descripcion || null,
        precio: parseFloat(precio),
        stock: stock ? parseInt(stock) : null,
        imagen_producto: imagen_producto || null,
        estado: stockNum > 0,
      },
      id_sucursal
    );

    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }

    res.status(201).json({
      message: "Producto creado correctamente ✅",
      data: result.data,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const listarProductos = async (req: Request, res: Response) => {
  try {
    const { id_sucursal, todos } = req.query;

    if (id_sucursal) {
      if (todos === "true") {
        const productos = await listarTodosProductosPorSucursal(id_sucursal as string);
        return res.status(200).json(productos);
      }
      const productos = await listarProductosPorSucursal(id_sucursal as string);
      return res.status(200).json(productos);
    }

    const productos = await listarTodosLosProductos();
    res.status(200).json(productos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerProducto = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const producto = await obtenerProductoPorId(id);
    res.status(200).json(producto);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const modificarProducto = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    
    const role = Array.isArray(req.headers.role)
      ? req.headers.role[0]
      : req.headers.role;

    if (role !== "admin") {
      return res.status(403).json({ error: "No autorizado" });
    }

    const { nom_producto, descripcion, precio, stock, imagen_producto, estado } = req.body;
    const stockNum = stock ? parseInt(stock) : 0;
    if (!nom_producto || !precio) {
      return res.status(400).json({ error: "nom_producto y precio son obligatorios" });
    }

    const result = await modificarProductoDB(id, {
      nom_producto,
      descripcion: descripcion || null,
      precio: parseFloat(precio),
      stock: stock ? parseInt(stock) : null,
      imagen_producto: imagen_producto || null,
      estado: estado ?? true,
    });

    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }

    res.json({ message: "Producto actualizado correctamente ✅", data: result.data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const suspenderProducto = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const role = req.headers.role as string;

    if (role !== "admin") {
      return res.status(403).json({ error: "No autorizado" });
    }

    const result = await suspenderProductoDB(id);

    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }

    res.json({ message: "Producto suspendido correctamente ✅", data: result.data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
