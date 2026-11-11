import { getApiBaseUrl } from '../../config/api';
import { ArchivoMedia, ConfiguracionInstitucional } from '../../types';
import { getAdminAuthHeaders, uploadWithProgress } from './image-upload.service';
import { validateImageFileClient } from './image-validation.service';

export interface MediaListResponse {
  items: ArchivoMedia[];
  resumen: {
    total: number;
    en_uso: number;
    sin_uso: number;
    total_bytes: number;
  };
}

export const imageUpdateService = {
  async listarImagenes(params?: {
    categoria?: string;
    eleccionId?: string;
    soloSinUso?: boolean;
    q?: string;
  }): Promise<MediaListResponse> {
    const query = new URLSearchParams();
    if (params?.categoria && params.categoria !== 'todas') query.set('categoria', params.categoria);
    if (params?.eleccionId) query.set('eleccion_id', params.eleccionId);
    if (params?.soloSinUso) query.set('solo_sin_uso', 'true');
    if (params?.q?.trim()) query.set('q', params.q.trim());

    const qs = query.toString();
    const res = await fetch(`${getApiBaseUrl()}/admin/media${qs ? `?${qs}` : ''}`, {
      headers: {
        ...getAdminAuthHeaders(),
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'No se pudo obtener el catálogo de imágenes.');
    }

    return res.json();
  },

  async reemplazarImagen(
    mediaId: string,
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<ArchivoMedia> {
    const validation = await validateImageFileClient(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'Archivo de reemplazo inválido.');
    }

    const formData = new FormData();
    formData.append('file', file);

    return uploadWithProgress<ArchivoMedia>({
      url: `${getApiBaseUrl()}/admin/media/${mediaId}/replace`,
      method: 'PUT',
      formData,
      headers: getAdminAuthHeaders(),
      onProgress,
    });
  },

  async actualizarMetadatos(
    mediaId: string,
    data: {
      alt_text?: string;
      entidad_tipo?: string;
      entidad_id?: string;
      eleccion_id?: string;
    },
  ): Promise<ArchivoMedia> {
    const res = await fetch(`${getApiBaseUrl()}/admin/media/${mediaId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAdminAuthHeaders(),
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al actualizar metadatos de la imagen.');
    }

    return res.json();
  },

  async obtenerInstitucionalPublica(): Promise<{
    institucion: ConfiguracionInstitucional;
    material_electoral: Array<{
      id: string;
      nombre_original: string;
      url_publica: string;
      alt_text: string | null;
    }>;
  } | null> {
    try {
      const res = await fetch(`${getApiBaseUrl()}/public/media/institucion`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async actualizarInstitucional(data: {
    nombre_institucion?: string;
    subtitulo?: string;
    titulo_portada?: string;
    logo_media_id?: string | null;
    banner_media_id?: string | null;
  }): Promise<ConfiguracionInstitucional> {
    const res = await fetch(`${getApiBaseUrl()}/admin/media/institucion/configuracion`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAdminAuthHeaders(),
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'No se pudo guardar la configuración visual institucional.');
    }

    return res.json();
  },
};

