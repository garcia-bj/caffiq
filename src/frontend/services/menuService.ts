import { api } from "./api";
import { Producto } from "../types/producto";

export const agregarProductoAPI = async (datos: {
  id_sucursal: string;
  nom_producto: string;
  descripcion?: string;
  precio: string;
  stock?: string;
  imagen_producto?: string;
}) => {
  return await api("/api/menu", {
    method: "POST",
    body: JSON.stringify(datos),
  });
};

export const listarProductosAPI = async (id_sucursal?: string): Promise<Producto[]> => {
  const url = id_sucursal
    ? `/api/menu?id_sucursal=${id_sucursal}`
    : "/api/menu";
  return await api(url, { method: "GET" });
};

export const modificarProductoAPI = async (id: string, datos: {
  nom_producto: string;
  descripcion?: string;
  precio: string;
  stock?: string;
  imagen_producto?: string;
  estado?: boolean;
}) => {
  return await api(`/api/menu/${id}/editar`, {
    method: "PUT",
    headers: { role: "admin" },
    body: JSON.stringify(datos),
  });
};

export const suspenderProductoAPI = async (id: string) => {
  return await api(`/api/menu/${id}/suspender`, {
    method: "PATCH",
    headers: { role: "admin" },
  });
};

export const listarTodosProductosAPI = async (id_sucursal: string): Promise<Producto[]> => {
  return await api(`/api/menu?id_sucursal=${id_sucursal}&todos=true`, { method: "GET" });
};