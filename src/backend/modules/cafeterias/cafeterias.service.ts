import { AppError } from "@shared/errors/AppError";
import { cafeteriasRepository } from "./cafeterias.repository";
import type { CafeteriaPublica, SucursalPublica } from "./cafeterias.dto";

export const cafeteriasService = {

  async listar(): Promise<CafeteriaPublica[]> {
    return cafeteriasRepository.listar();
  },

  async sucursales(cafeteria_id: string): Promise<SucursalPublica[]> {
    const cafeteria = await cafeteriasRepository.buscarPorId(cafeteria_id);
    if (!cafeteria) throw new AppError("Cafetería no encontrada", 404);
    return cafeteriasRepository.sucursalesPorCafeteria(cafeteria_id);
  },
};
