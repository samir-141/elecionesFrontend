export type EleccionEstado = 'BORRADOR' | 'ABIERTA' | 'CERRADA' | 'ESCRUTADA';

export type PuestoEstado = 'LIBRE' | 'RESERVADO' | 'FUERA_SERVICIO';

export type ElectorEstado = 'PENDIENTE' | 'HABILITADO' | 'VOTO';

export interface ReglasEleccion {
  blanco_en_porcentaje: boolean;
  porcentaje_minimo_ganar: number;
  segunda_vuelta: boolean;
  cuantos_pasan_segunda_vuelta: number;
  quorum_porcentaje: number;
  accion_sin_quorum: 'DECLARAR_DESIERTA' | 'PRORROGAR';
  regla_empate: 'SORTEO' | 'ANTIGUEDAD';
  duracion_reserva_segundos: number;
  ip_restringida: string | null;
}

export interface Eleccion {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: EleccionEstado;
  reglas: ReglasEleccion;
  huella_sha256: string | null;
  created_at: string;
  abierta_at: string | null;
  cerrada_at: string | null;
}

export interface Aula {
  id: string;
  eleccion_id: string;
  numero: number;
  nombre: string;
  capacidad: number;
}

export interface Partido {
  id: string;
  eleccion_id: string;
  numero_lista: number;
  nombre: string;
  lema: string | null;
  logo_url: string | null;
}

export interface Puesto {
  id: string;
  aula_id: string;
  numero_puesto: number;
  estado: PuestoEstado;
  ultimo_heartbeat: string | null;
}

export interface Elector {
  id: string;
  eleccion_id: string;
  aula_id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  grado_seccion: string;
  estado: ElectorEstado;
}

export interface OpcionCedula {
  id: string; // UUID del partido o 'BLANCO'
  numero_lista: number;
  nombre: string;
  lema?: string | null;
  logo_url?: string | null;
}

