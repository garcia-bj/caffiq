import type { ICafeteriaRepository } from "../../domain/repositories/ICafeteriaRepository";
import type { CafeteriaEntity, CafeteriaUpdateInput } from "../../domain/entities/Cafeteria";

export class ActualizarCafeteria {
  constructor(private readonly repo: ICafeteriaRepository) {}

  async execute(id: string, admin_id: string, datos: CafeteriaUpdateInput): Promise<CafeteriaEntity> {
    return this.repo.actualizar(id, admin_id, datos);
  }
}
