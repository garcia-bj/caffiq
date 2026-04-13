const API_URL = "http://192.168.56.1:3000"; // ← TU IP PERSONAL

export const api = async (endpoint: string, options?: RequestInit) => {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  return res.json();
};