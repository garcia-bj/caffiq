import type { ICafeteriaRepository } from "../../domain/repositories/ICafeteriaRepository";
import type { CafeteriaEntity } from "../../domain/entities/Cafeteria";

export class ListarCafeterias {
  constructor(private readonly cafeteriaRepo: ICafeteriaRepository) {}

  async execute(): Promise<CafeteriaEntity[]> {
    return this.cafeteriaRepo.listar();
  }
}
