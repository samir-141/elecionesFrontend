import { getApiBaseUrl } from '../../../config/api';

export interface OpcionCedula {
  id: string;
  numero_lista: number;
  nombre: string;
  lema: string | null;
  logo_url: string | null;
  candidatos?: Array<{
    id: string;
    nombres: string;
    apellidos: string;
    cargo: string;
    foto_url: string | null;
  }>;
}

export interface CedulaResponse {
  schema_version: string;
  opciones: OpcionCedula[];
}

export const votoApiService = {
  async obtenerCedula(tokenVoto: string): Promise<CedulaResponse> {
    const res = await fetch(`${getApiBaseUrl()}/voto/cedula`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        Pragma: 'no-cache',
      },
      body: JSON.stringify({ token_voto: tokenVoto }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Error al obtener la cédula' }));
      throw new Error(error.message || 'Error al obtener la cédula');
    }

    return await res.json();
  },

  async emitirVoto(
    tokenVoto: string,
    partidoId: string | null,
    esBlanco: boolean,
  ): Promise<{ status: string; mensaje: string }> {
    const res = await fetch(`${getApiBaseUrl()}/voto/emitir`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        Pragma: 'no-cache',
      },
      body: JSON.stringify({
        token_voto: tokenVoto,
        partido_id: esBlanco ? null : partidoId,
        es_blanco: esBlanco,
      }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Error al depositar el voto' }));
      throw new Error(error.message || 'Error al depositar el voto');
    }

    return await res.json();
  },
};

