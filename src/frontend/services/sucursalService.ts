// frontend/services/sucursalService.ts
import { api } from "./api";
import { Sucursal } from "../types/sucursal";

export const getSucursalesAPI = async (): Promise<Sucursal[]> => {
  return await api("/api/sucursales", { method: "GET" });
};

export const listarTodasSucursalesAPI = async (): Promise<Sucursal[]> => {
  return await api("/api/sucursales/todas", { method: "GET" });
};

export const crearSucursalAPI = async (data: Omit<Sucursal, "id">) => {
  return await api("/api/sucursales", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const listarSucursalesAPI = async () => {
  return await api("/api/sucursales", { method: "GET" });
};

export const suspenderSucursalAPI = async (id: string) => {
  return await api(`/api/sucursales/${id}/suspender`, {
    method: "PATCH",
    headers: { role: "admin" },
  });
};

export const modificarSucursalAPI = async (id: string, datos: {
  nombre: string;
  direccion: string;
  imagen_url: string;
  activa: boolean;
}) => {
  return await api(`/api/sucursales/${id}/editar`, {
    method: "PUT",
    headers: { role: "admin" },
    body: JSON.stringify(datos),
  });
};
