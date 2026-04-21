const API_URL = "http://10.232.41.10:3000"; // ← TU IP PERSONAL

export const api = async (endpoint: string, options?: RequestInit) => {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  return res.json();
};