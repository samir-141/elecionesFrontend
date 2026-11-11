import { getApiBaseUrl } from '../../config/api';
import { MediaUsageRef } from '../../types';
import { getAdminAuthHeaders } from './image-upload.service';

export class ImageInUseConflictError extends Error {
  usadoEn: MediaUsageRef[];
  constructor(message: string, usadoEn: MediaUsageRef[]) {
    super(message);
    this.name = 'ImageInUseConflictError';
    this.usadoEn = usadoEn;
  }
}

export const imageDeleteService = {
  async eliminarImagen(
    mediaId: string,
    forzar = false,
  ): Promise<{ success: boolean; id: string; message: string }> {
    const res = await fetch(
      `${getApiBaseUrl()}/admin/media/${mediaId}${forzar ? '?forzar=true' : ''}`,
      {
        method: 'DELETE',
        headers: {
          ...getAdminAuthHeaders(),
        },
      },
    );

    if (res.status === 409) {
      const body = await res.json().catch(() => ({}));
      throw new ImageInUseConflictError(
        body.message || 'La imagen está vinculada a entidades activas.',
        body.usado_en || [],
      );
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'No se pudo eliminar la imagen de Supabase Storage.');
    }

    return res.json();
  },
};

