import { getApiBaseUrl } from '../../config/api';
import {
  FrontendSupabaseEnvStatus,
  inspectFrontendSupabaseEnv,
} from '../../lib/supabase/client';
import { getAdminAuthHeaders } from './image-upload.service';

export type DiagnosticStatus = 'Correcto' | 'Advertencia' | 'Error';

export interface DiagnosticItem {
  componente: 'Supabase' | 'Storage' | 'Buckets' | 'Permisos' | 'Base de datos';
  estado: DiagnosticStatus;
  detalle: string;
  solucion?: string;
}

export interface MissingEnvItem {
  variable: string;
  scope: 'server' | 'client';
  required: boolean;
  reason: string;
  whereToGet: string;
  exampleValue: string;
}

export interface SupabaseDiagnosticReport {
  timestamp: string;
  listoParaOperar: boolean;
  componentes: DiagnosticItem[];
  envStatus: {
    configured: boolean;
    hasUrl: boolean;
    hasAnonKey: boolean;
    hasServiceRoleKey: boolean;
    supabaseUrlValid: boolean;
    inferredProjectRefFromDb: string | null;
    missingVariables: MissingEnvItem[];
    checkedFiles: { path: string; exists: boolean }[];
  };
  frontendEnvStatus: FrontendSupabaseEnvStatus;
  bucketsEsperados: Array<{ name: string; publico: boolean; existe: boolean; detalle: string }>;
  bucketsDetectadosEnStorage: Array<{ id: string; name: string; public: boolean }>;
  bucketsLegacyDetectadosEnDb: Array<{ id: string; name: string; public: boolean }>;
}

export const mediaDiagnosticService = {
  async ejecutarDiagnostico(): Promise<SupabaseDiagnosticReport> {
    const frontendEnvStatus = inspectFrontendSupabaseEnv();

    const res = await fetch(`${getApiBaseUrl()}/admin/media/diagnostico`, {
      headers: {
        ...getAdminAuthHeaders(),
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        err.message ||
          `No se pudo ejecutar el diagnóstico del servidor (HTTP ${res.status}). Verifica que tu sesión de administrador siga activa.`,
      );
    }

    const serverReport = await res.json();
    return {
      ...serverReport,
      frontendEnvStatus,
    };
  },

  async inicializarBuckets(): Promise<{
    success: boolean;
    diagnostico: SupabaseDiagnosticReport;
  }> {
    const res = await fetch(`${getApiBaseUrl()}/admin/media/diagnostico/inicializar-buckets`, {
      method: 'POST',
      headers: {
        ...getAdminAuthHeaders(),
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'No se pudieron inicializar los buckets automáticamente.');
    }

    const data = await res.json();
    return {
      success: Boolean(data.success),
      diagnostico: {
        ...data.diagnostico,
        frontendEnvStatus: inspectFrontendSupabaseEnv(),
      },
    };
  },
};

