import { getApiBaseUrl } from '../../../config/api';

export interface SolicitudEmparejamientoResponse {
  puesto_id: string;
  numero_puesto: number;
  aula: string;
  qr_token: string;
  qr_data_url: string;
  expires_at: string;
}

export interface VerificarQrResponse {
  status: 'PENDING' | 'APPROVED' | 'EXPIRED' | 'INVALID';
  puesto_id?: string;
  numero_puesto?: number;
  aula_id?: string;
  aula_nombre?: string;
  token_sesion?: string;
  estado?: string;
  message?: string;
}

export interface SincronizarPuestoResponse {
  ok: boolean;
  puesto_id: string;
  numero_puesto: number;
  aula_nombre: string;
  estado: 'LIBRE' | 'RESERVADO' | 'FUERA_SERVICIO';
  token_voto?: string | null;
}

export const puestosKioscoService = {
  async obtenerEleccionActiva() {
    const res = await fetch(`${getApiBaseUrl()}/admin/elecciones/activa`, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) {
      throw new Error('No se pudo obtener información de la elección activa.');
    }
    return res.json();
  },

  async solicitarEmparejamiento(
    aulaId: string,
    numeroPuesto: number,
  ): Promise<SolicitudEmparejamientoResponse> {
    const res = await fetch(`${getApiBaseUrl()}/puesto/solicitar-emparejamiento`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aula_id: aulaId,
        numero_puesto: numeroPuesto,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error al solicitar emparejamiento' }));
      throw new Error(err.message || 'Error al conectar con la mesa electoral.');
    }

    return res.json();
  },

  async verificarQr(token: string): Promise<VerificarQrResponse> {
    const res = await fetch(`${getApiBaseUrl()}/puesto/verificar-qr/${token}`, {
      headers: { 'Cache-Control': 'no-cache' },
    });

    if (!res.ok) {
      return { status: 'INVALID', message: 'Error al verificar QR' };
    }

    return res.json();
  },

  async sincronizar(puestoId: string, tokenSesion: string): Promise<SincronizarPuestoResponse> {
    const res = await fetch(`${getApiBaseUrl()}/puesto/sincronizar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-puesto-token': tokenSesion,
      },
      body: JSON.stringify({
        puesto_id: puestoId,
        token_sesion: tokenSesion,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error de sincronización' }));
      throw new Error(err.message || 'Error de sincronización del puesto.');
    }

    return res.json();
  },

  async desvincular(puestoId: string, tokenSesion: string): Promise<void> {
    try {
      await fetch(`${getApiBaseUrl()}/puesto/desvincular`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-puesto-token': tokenSesion,
        },
        body: JSON.stringify({
          puesto_id: puestoId,
          token_sesion: tokenSesion,
        }),
      });
    } catch {
      // Ignorar error al desvincular
    }
  },
};

