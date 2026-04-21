import { AppError } from "@shared/errors/AppError";
import type { ICafeteriaRepository } from "../../domain/repositories/ICafeteriaRepository";
import type { ISucursalRepository } from "../../domain/repositories/ISucursalRepository";
import type { SucursalEntity } from "../../domain/entities/Sucursal";

export class ObtenerSucursales {
  constructor(
    private readonly cafeteriaRepo: ICafeteriaRepository,
    private readonly sucursalRepo: ISucursalRepository,
  ) {}

  async execute(cafeteria_id: string): Promise<SucursalEntity[]> {
    const cafeteria = await this.cafeteriaRepo.buscarPorId(cafeteria_id);
    if (!cafeteria) throw new AppError("Cafetería no encontrada", 404);
    return this.sucursalRepo.listarPorCafeteria(cafeteria_id);
  }
}
