import { AppError } from "@shared/errors/AppError";
import type { ISucursalRepository } from "../../domain/repositories/ISucursalRepository";
import type { SucursalEntity, ModificarSucursalData } from "../../domain/entities/Sucursal";

export class ModificarSucursal {
  constructor(private readonly sucursalRepo: ISucursalRepository) {}

  async execute(id: string, datos: ModificarSucursalData): Promise<SucursalEntity> {
    const sucursal = await this.sucursalRepo.buscarPorId(id);
    if (!sucursal) throw new AppError("Sucursal no encontrada", 404);
    if (!sucursal.activa) throw new AppError("No se puede modificar una sucursal suspendida", 400);

    if (datos.nombre && datos.nombre !== sucursal.nombre) {
      const duplicado = await this.sucursalRepo.existeNombreEnCafeteria(datos.nombre, sucursal.cafeteria_id, id);
      if (duplicado) throw new AppError("Ya existe una sucursal con ese nombre en esta cafetería", 409);
    }

    return this.sucursalRepo.modificar(id, datos);
  }
}
