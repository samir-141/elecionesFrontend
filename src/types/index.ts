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

export interface Candidato {
  id: string;
  eleccion_id: string;
  partido_id: string;
  nombres: string;
  apellidos: string;
  cargo: string;
  orden: number;
  foto_url: string | null;
  foto_media_id?: string | null;
}

export interface Partido {
  id: string;
  eleccion_id: string;
  numero_lista: number;
  nombre: string;
  lema: string | null;
  logo_url: string | null;
  logo_media_id?: string | null;
  candidatos?: Candidato[];
}

export type MediaCategoria =
  | 'candidatos'
  | 'listas'
  | 'organizaciones'
  | 'instituciones'
  | 'usuarios'
  | 'material-electoral';

export interface MediaUsageRef {
  tipo: 'partido' | 'candidato' | 'docente' | 'eleccion' | 'institucion';
  id: string;
  etiqueta: string;
}

export interface ArchivoMedia {
  id: string;
  nombre_original: string;
  nombre_interno: string;
  bucket: string;
  ruta_archivo: string;
  url_publica: string | null;
  url_visualizacion: string | null;
  es_privado: boolean;
  mime_type: string;
  tamano_bytes: number;
  checksum_sha256?: string | null;
  categoria: MediaCategoria;
  entidad_tipo?: string | null;
  entidad_id?: string | null;
  eleccion_id?: string | null;
  subido_por: string;
  alt_text?: string | null;
  en_uso: boolean;
  usado_en: MediaUsageRef[];
  created_at: string;
  updated_at: string;
}

export interface ConfiguracionInstitucional {
  id?: string;
  clave: string;
  nombre_institucion: string;
  subtitulo: string;
  titulo_portada: string;
  logo_url: string | null;
  logo_media_id?: string | null;
  banner_url: string | null;
  banner_media_id?: string | null;
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
  candidatos?: Array<{
    id: string;
    nombres: string;
    apellidos: string;
    cargo: string;
    foto_url: string | null;
  }>;
}

