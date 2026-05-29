export interface OpcionPersonalizacion {
  id: string;
  personalizacion_id: string;
  nombre: string;
  precio_adicional: number;
  orden: number;
}

export interface PersonalizacionEntity {
  id: string;
  cafeteria_id: string;
  nombre: string;
  requerido: boolean;
  orden: number;
  activo: boolean;
  created_at: string;
  opciones: OpcionPersonalizacion[];
}

export interface PersonalizacionInput {
  nombre: string;
  requerido?: boolean;
  orden?: number;
}

export interface OpcionInput {
  nombre: string;
  precio_adicional?: number;
  orden?: number;
}
