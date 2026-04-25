import { AppError } from "@shared/errors/AppError";
import type { IProductoRepository } from "../../domain/repositories/IProductoRepository";
import type { ProductoEntity, CrearProductoData } from "../../domain/entities/Producto";

const BADGES_VALIDOS = ["Popular", "Nuevo", "Fresco"];

export class CrearProducto {
  constructor(private readonly repo: IProductoRepository) {}

  async execute(datos: CrearProductoData): Promise<ProductoEntity> {
    if (datos.precio <= 0) throw new AppError("El precio debe ser mayor a 0", 400);
    if (datos.badge && !BADGES_VALIDOS.includes(datos.badge)) {
      throw new AppError(`Badge inválido. Usa: ${BADGES_VALIDOS.join(", ")}`, 400);
    }
    return this.repo.crear(datos);
  }
}
