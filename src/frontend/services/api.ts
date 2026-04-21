const API_URL = "http://192.168.56.1:3000";

export const api = async (endpoint: string, options?: RequestInit) => {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers, // 👈 combina headers en lugar de sobreescribir
    },
  });

  const data = await res.json();

  // 👈 lanza error si el servidor responde con error
  if (!res.ok) {
    throw new Error(data.error || "Error en la petición");
  }

  return data;
};