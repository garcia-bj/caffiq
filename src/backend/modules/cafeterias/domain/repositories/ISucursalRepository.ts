import type { SucursalEntity, CrearSucursalData, ModificarSucursalData } from "../entities/Sucursal";

export interface ISucursalRepository {
  listarPorCafeteria(cafeteria_id: string): Promise<SucursalEntity[]>;
  buscarPorId(id: string): Promise<SucursalEntity | null>;
  crear(datos: CrearSucursalData): Promise<SucursalEntity>;
  modificar(id: string, datos: ModificarSucursalData): Promise<SucursalEntity>;
  suspender(id: string): Promise<void>;
  existeNombreEnCafeteria(nombre: string, cafeteria_id: string, excluirId?: string): Promise<boolean>;
}
