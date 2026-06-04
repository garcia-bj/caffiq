export interface VerificacionCodigoRow {
  id: string;
  usuario_id: string;
  num_telefono: string;
  codigo: string;
  usado: boolean;
  expira_en: string;
  created_at: string;
}

export interface IVerificacionRepository {
  invalidarAnteriores(usuario_id: string): Promise<void>;
  guardar(usuario_id: string, num_telefono: string, codigo: string, expira_en: string): Promise<void>;
  buscarValido(usuario_id: string, codigo: string): Promise<VerificacionCodigoRow | null>;
  marcarUsado(id: string): Promise<void>;
  tieneCodigoReciente(usuario_id: string): Promise<boolean>;
}
