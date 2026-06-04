import type { CafeteriaEntity, CafeteriaUpdateInput } from "../entities/Cafeteria";

export interface ICafeteriaRepository {
  listar(): Promise<CafeteriaEntity[]>;
  buscarPorId(id: string): Promise<CafeteriaEntity | null>;
  actualizar(id: string, admin_id: string, datos: CafeteriaUpdateInput): Promise<CafeteriaEntity>;
}
