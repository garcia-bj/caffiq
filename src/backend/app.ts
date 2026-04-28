import express from "express";
import { corsOptions } from "@config/cors";
import authRoutes from "@modules/auth/interfaces/auth.routes";
import cafeteriasRoutes from "@modules/cafeterias/interfaces/cafeterias.routes";
import productosRoutes from "@modules/productos/interfaces/productos.routes";
import { errorHandler } from "@shared/errors/error.handler";
import { SupabaseSucursalRepository } from "@modules/cafeterias/infrastructure/repositories/SupabaseSucursalRepository";

const app = express();

// ── Middlewares globales ──────────────────────────────────────────────────────
app.use(corsOptions);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, servicio: "Caffiq API", version: "1.0.0" });
});

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/cafeterias", cafeteriasRoutes);
app.use("/api/cafeterias/:cafeteria_id/productos", productosRoutes);

// GET /api/sucursales — listado global de sucursales activas (usado por pantallas de menú)
app.get("/api/sucursales", async (_req, res, next) => {
  try {
    const repo = new SupabaseSucursalRepository();
    const sucursales = await repo.listarTodas();
    res.json(sucursales);
  } catch (err) { next(err); }
});

// ── Ruta no encontrada ────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ ok: false, mensaje: "Ruta no encontrada" });
});

// ── Manejador de errores global (debe ir al final) ────────────────────────────
app.use(errorHandler);

export default app;
