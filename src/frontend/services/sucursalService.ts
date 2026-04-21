/*import { api } from "./api";

export const crearSucursalAPI = async (data: any) => {
  try {
    const response = await fetch(`${api}/sucursales`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.log("Error creando sucursal:", error);
    return { error };
  }
};*/
import { api } from "./api";

export const crearSucursalAPI = async (data: any) => {
  return await api("/api/sucursales", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const listarSucursalesAPI = async () => {
  return await api("/api/sucursales", {
    method: "GET",
  });
};

export const suspenderSucursalAPI = async (id: string) => {
  return await api(`/api/sucursales/${id}/suspender`, {
    method: "PATCH",
    headers: {
      "role": "admin",
    },
  });
};

export const modificarSucursalAPI = async (id: string, datos: {
  nombre: string;
  direccion: string;
  imagen: string;
}) => {
  return await api(`/api/sucursales/${id}/editar`, {
    method: "PUT",
    headers: { "role": "admin" },
    body: JSON.stringify(datos),
  });
};