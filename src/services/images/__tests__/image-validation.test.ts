import { describe, it, expect } from 'vitest';
import { validateImageFileClient } from '../image-validation.service';
import { inspectFrontendSupabaseEnv } from '../../../lib/supabase/client';
import { MAX_IMAGE_SIZE_BYTES } from '../../../lib/supabase/storage-config';

describe('Validación de Imágenes Frontend y Diagnóstico de Cliente Supabase', () => {
  it('acepta imagen PNG válida dentro del límite permitido', async () => {
    const file = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'logo.png', {
      type: 'image/png',
    });
    const res = await validateImageFileClient(file);
    expect(res.valid).toBe(true);
  });

  it('rechaza archivos con extensión no permitida (.exe / .pdf)', async () => {
    const file = new File([new Uint8Array([0x4d, 0x5a])], 'payload.exe', {
      type: 'application/x-msdownload',
    });
    const res = await validateImageFileClient(file);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Formato no permitido');
  });

  it('rechaza imágenes que exceden el tamaño máximo configurado', async () => {
    const big = new Uint8Array(MAX_IMAGE_SIZE_BYTES + 10);
    const file = new File([big], 'grande.jpg', { type: 'image/jpeg' });
    const res = await validateImageFileClient(file);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('supera el límite permitido');
  });

  it('rechaza archivos SVG que contengan scripts maliciosos', async () => {
    const svgFile = new File(
      ['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'],
      'malicioso.svg',
      { type: 'image/svg+xml' },
    );
    const res = await validateImageFileClient(svgFile);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('seguridad');
  });

  it('reporta de forma explícita las variables VITE_SUPABASE_* si faltan en cliente', () => {
    const status = inspectFrontendSupabaseEnv();
    if (!status.configured) {
      expect(status.missing.length).toBeGreaterThan(0);
    } else {
      expect(status.hasUrl).toBe(true);
      expect(status.hasAnonKey).toBe(true);
    }
  });
});

