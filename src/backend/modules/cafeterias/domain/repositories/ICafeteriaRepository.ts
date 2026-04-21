import type { CafeteriaEntity } from "../entities/Cafeteria";

export interface ICafeteriaRepository {
  listar(): Promise<CafeteriaEntity[]>;
  buscarPorId(id: string): Promise<CafeteriaEntity | null>;
}
