export interface CafeteriaPublica {
  id:               string;
  nom_cafeteria:    string;
  ciudad:           string;
  descripcion:      string | null;
  horario_apertura: string | null;
  horario_cierre:   string | null;
  activa:           boolean;
  created_at:       string;
}

export interface SucursalPublica {
  id:               string;
  cafeteria_id:     string;
  nombre:           string;
  direccion:        string;
  ciudad:           string;
  horario_apertura: string | null;
  horario_cierre:   string | null;
  imagen_url:       string | null;
  latitud:          number | null;
  longitud:         number | null;
  activa:           boolean;
  created_at:       string;
}
