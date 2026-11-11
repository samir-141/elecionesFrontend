import { getApiBaseUrl } from '../../config/api';
import { ArchivoMedia, MediaCategoria } from '../../types';
import { validateImageFileClient } from './image-validation.service';

export interface UploadImageParams {
  file: File;
  categoria: MediaCategoria;
  eleccionId?: string;
  entidadTipo?: string;
  entidadId?: string;
  altText?: string;
  onProgress?: (percent: number) => void;
}

export function getAdminAuthHeaders(): Record<string, string> {
  const token = sessionStorage.getItem('admin_token') || '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function uploadWithProgress<T>(params: {
  url: string;
  method: 'POST' | 'PUT';
  formData: FormData;
  headers?: Record<string, string>;
  onProgress?: (percent: number) => void;
}): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(params.method, params.url, true);

    if (params.headers) {
      for (const [key, val] of Object.entries(params.headers)) {
        xhr.setRequestHeader(key, val);
      }
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && params.onProgress) {
        const pct = Math.min(99, Math.round((event.loaded / event.total) * 100));
        params.onProgress(pct);
      }
    };

    xhr.onload = () => {
      let body: any = {};
      try {
        body = JSON.parse(xhr.responseText || '{}');
      } catch {
        body = {};
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        params.onProgress?.(100);
        resolve(body as T);
      } else {
        const msg = Array.isArray(body?.message)
          ? body.message.join('. ')
          : body?.message || `Error HTTP ${xhr.status} al procesar la imagen.`;
        reject(new Error(msg));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Error de red al comunicarse con el servidor de almacenamiento de imágenes.'));
    };

    xhr.send(params.formData);
  });
}

export const imageUploadService = {
  async uploadAdminImage(params: UploadImageParams): Promise<ArchivoMedia> {
    const validation = await validateImageFileClient(params.file);
    if (!validation.valid) {
      throw new Error(validation.error || 'Archivo de imagen inválido.');
    }

    const formData = new FormData();
    formData.append('file', params.file);
    formData.append('categoria', params.categoria);
    if (params.eleccionId) formData.append('eleccion_id', params.eleccionId);
    if (params.entidadTipo) formData.append('entidad_tipo', params.entidadTipo);
    if (params.entidadId) formData.append('entidad_id', params.entidadId);
    if (params.altText) formData.append('alt_text', params.altText);

    return uploadWithProgress<ArchivoMedia>({
      url: `${getApiBaseUrl()}/admin/media/upload`,
      method: 'POST',
      formData,
      headers: getAdminAuthHeaders(),
      onProgress: params.onProgress,
    });
  },
};

