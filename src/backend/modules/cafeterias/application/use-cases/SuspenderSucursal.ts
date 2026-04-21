import { AppError } from "@shared/errors/AppError";
import type { ISucursalRepository } from "../../domain/repositories/ISucursalRepository";

export class SuspenderSucursal {
  constructor(private readonly sucursalRepo: ISucursalRepository) {}

  async execute(id: string): Promise<{ mensaje: string }> {
    const sucursal = await this.sucursalRepo.buscarPorId(id);
    if (!sucursal) throw new AppError("Sucursal no encontrada", 404);
    if (!sucursal.activa) throw new AppError("La sucursal ya está suspendida", 400);

    await this.sucursalRepo.suspender(id);
    return { mensaje: "Sucursal suspendida correctamente" };
  }
}
