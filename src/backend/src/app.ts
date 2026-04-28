import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import express from "express";

// 🔹 Importar rutas
import sucursalRoutes from "./modules/sucursal/interfaces/routes";
import menuRoutes from "./modules/menu/interfaces/routes";

const app = express();

// 🔹 Middlewares
app.use(cors()); // permitir conexión con tu frontend (Expo)
app.use(express.json()); // leer JSON

// 🔹 Ruta base
app.get("/", (req, res) => {
  res.send("API de CAFFIQ funcionando 🚀");
});

// 🔹 Usar rutas de módulos
app.use("/api/sucursales", sucursalRoutes);
app.use("/api/menu", menuRoutes);

// 🔹 Puerto
const PORT = 3000;

// 🔹 Levantar servidor
app.listen(PORT, "0.0.0.0",() => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});