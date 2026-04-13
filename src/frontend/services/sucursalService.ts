import { API_URL } from "./api";

export const crearSucursalAPI = async (data: any) => {
  try {
    const response = await fetch(`${API_URL}/sucursales`, {
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
};