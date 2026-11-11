import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  formatBytes,
  MAX_IMAGE_SIZE_BYTES,
} from '../../lib/supabase/storage-config';

export interface ClientValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validación preventiva en navegador antes de enviar la imagen al backend.
 * La validación definitiva e incondicional (magic bytes + sanitización SVG + RBAC)
 * siempre ocurre en el servidor (Invariante I11 Zero Trust Client).
 */
export async function validateImageFileClient(
  file: File,
  maxBytes = MAX_IMAGE_SIZE_BYTES,
): Promise<ClientValidationResult> {
  if (!file) {
    return { valid: false, error: 'Debes seleccionar un archivo de imagen.' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'El archivo seleccionado está vacío (0 bytes).' };
  }

  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `El archivo (${formatBytes(file.size)}) supera el límite permitido de ${formatBytes(maxBytes)}.`,
    };
  }

  const lowerName = file.name.toLowerCase();
  const hasValidExt = ALLOWED_IMAGE_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  if (!hasValidExt) {
    return {
      valid: false,
      error: 'Formato no permitido. Solo se aceptan imágenes JPG, JPEG, PNG, WEBP o SVG.',
    };
  }

  if (
    file.type &&
    !(ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)
  ) {
    return {
      valid: false,
      error: `Tipo MIME no permitido (${file.type}). Usa JPG, PNG, WEBP o SVG.`,
    };
  }

  // Inspección preventiva rápida si es SVG para rechazar scripts antes de subir
  if (lowerName.endsWith('.svg') || file.type === 'image/svg+xml') {
    try {
      const content = await file.text();
      if (!/<svg\b/i.test(content)) {
        return { valid: false, error: 'El archivo SVG no contiene una etiqueta <svg> válida.' };
      }
      if (/<script\b|\bon[a-z]{2,}\s*=|javascript\s*:/i.test(content)) {
        return {
          valid: false,
          error: 'SVG bloqueado por seguridad: contiene scripts o manejadores de eventos no permitidos.',
        };
      }
    } catch {
      return { valid: false, error: 'No fue posible leer el archivo SVG para verificar su seguridad.' };
    }
  }

  return { valid: true };
}

