import { AppError } from "@shared/errors/AppError";
import type { ISucursalRepository } from "../../domain/repositories/ISucursalRepository";
import type { ICafeteriaRepository } from "../../domain/repositories/ICafeteriaRepository";
import type { SucursalEntity, CrearSucursalData } from "../../domain/entities/Sucursal";

export class CrearSucursal {
  constructor(
    private readonly cafeteriaRepo: ICafeteriaRepository,
    private readonly sucursalRepo: ISucursalRepository,
  ) {}

  async execute(datos: CrearSucursalData): Promise<SucursalEntity> {
    const cafeteria = await this.cafeteriaRepo.buscarPorId(datos.cafeteria_id);
    if (!cafeteria) throw new AppError("Cafetería no encontrada", 404);

    const duplicado = await this.sucursalRepo.existeNombreEnCafeteria(datos.nombre, datos.cafeteria_id);
    if (duplicado) throw new AppError("Ya existe una sucursal con ese nombre en esta cafetería", 409);

    return this.sucursalRepo.crear(datos);
  }
}
