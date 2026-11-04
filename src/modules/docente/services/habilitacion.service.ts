import { getApiBaseUrl } from '../../../config/api';

export interface ElectorConsultado {
  elector_id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  grado_seccion: string;
  aula_nombre: string;
}

export interface HabilitacionConfirmada {
  status: 'HABILITADO';
  puesto_id: string;
  puesto_numero: number;
  mensaje: string;
  tiempo_reserva_segundos: number;
  token_voto: string;
}

export interface PuestoAulaBackend {
  id: string;
  aula_id: string;
  numero_puesto: number;
  estado: 'LIBRE' | 'RESERVADO' | 'FUERA_SERVICIO';
  token_sesion: string | null;
  ultimo_heartbeat: string | null;
}

export const habilitacionApiService = {
  async consultarDni(
    docenteAulaId: string,
    docenteId: string,
    dni: string,
    origen: 'CAMARA' | 'MANUAL' = 'CAMARA',
  ): Promise<ElectorConsultado> {
    const res = await fetch(`${getApiBaseUrl()}/docente/habilitacion/consultar-dni`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-docente-aula-id': docenteAulaId,
        'x-actor-id': docenteId,
      },
      body: JSON.stringify({ dni, origen_lectura: origen }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Error al consultar DNI' }));
      throw new Error(error.message || 'Error al consultar DNI');
    }

    return await res.json();
  },

  async confirmarHabilitacion(
    docenteAulaId: string,
    docenteId: string,
    electorId: string,
  ): Promise<HabilitacionConfirmada> {
    const res = await fetch(`${getApiBaseUrl()}/docente/habilitacion/confirmar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-docente-aula-id': docenteAulaId,
        'x-actor-id': docenteId,
      },
      body: JSON.stringify({ elector_id: electorId }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Error al habilitar puesto' }));
      throw new Error(error.message || 'Error al habilitar puesto');
    }

    return await res.json();
  },

  async cancelarHabilitacion(
    docenteAulaId: string,
    docenteId: string,
    electorId: string,
    motivo: string,
  ): Promise<{ mensaje: string; puesto_liberado: number }> {
    const res = await fetch(`${getApiBaseUrl()}/docente/habilitacion/cancelar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-docente-aula-id': docenteAulaId,
        'x-actor-id': docenteId,
      },
      body: JSON.stringify({ elector_id: electorId, motivo }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Error al cancelar habilitación' }));
      throw new Error(error.message || 'Error al cancelar habilitación');
    }

    return await res.json();
  },

  async listarPuestos(docenteAulaId: string): Promise<PuestoAulaBackend[]> {
    const res = await fetch(`${getApiBaseUrl()}/docente/puestos`, {
      headers: {
        'x-docente-aula-id': docenteAulaId,
        'Cache-Control': 'no-cache',
      },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Error al listar puestos' }));
      throw new Error(error.message || 'Error al listar puestos del aula');
    }

    return await res.json();
  },

  async emparejarPuesto(
    docenteAulaId: string,
    docenteId: string,
    tokenQr: string,
  ): Promise<{ puesto_id: string; numero_puesto: number; estado: string }> {
    const res = await fetch(`${getApiBaseUrl()}/docente/puestos/emparejar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-docente-aula-id': docenteAulaId,
        'x-actor-id': docenteId,
      },
      body: JSON.stringify({ token_qr: tokenQr.trim() }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Error al emparejar el puesto' }));
      throw new Error(error.message || 'Error al emparejar el puesto con el código QR');
    }

    return await res.json();
  },
};
