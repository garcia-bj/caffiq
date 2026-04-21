import express from "express";
import { corsOptions } from "@config/cors";
import authRoutes from "@modules/auth/auth.routes";
import cafeteriasRoutes from "@modules/cafeterias/cafeterias.routes";
import { errorHandler } from "@shared/errors/error.handler";

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

// ── Ruta no encontrada ────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ ok: false, mensaje: "Ruta no encontrada" });
});

// ── Manejador de errores global (debe ir al final) ────────────────────────────
app.use(errorHandler);

export default app;
