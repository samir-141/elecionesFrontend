import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface FrontendSupabaseEnvStatus {
  configured: boolean;
  hasUrl: boolean;
  hasAnonKey: boolean;
  missing: Array<{
    variable: string;
    whereToGet: string;
    reason: string;
  }>;
}

function isPlaceholder(val?: string): boolean {
  if (!val) return true;
  const trimmed = val.trim();
  return (
    !trimmed ||
    trimmed.includes('TU_PROJECT_REF') ||
    trimmed.includes('tu_anon_')
  );
}

/**
 * Inspecciona las variables públicas configuradas en el navegador (VITE_*).
 * NUNCA solicita ni lee claves administrativas SERVICE_ROLE_KEY en el cliente.
 */
export function inspectFrontendSupabaseEnv(): FrontendSupabaseEnvStatus {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || '';
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || '';

  const hasUrl = !isPlaceholder(url);
  const hasAnonKey = !isPlaceholder(anonKey);

  const missing: FrontendSupabaseEnvStatus['missing'] = [];

  if (!hasUrl) {
    missing.push({
      variable: 'VITE_SUPABASE_URL',
      whereToGet: 'Supabase Dashboard -> Project Settings -> API -> Project URL (en frontend/.env o .env.local)',
      reason: 'Permite al cliente navegador reconocer el endpoint público de Supabase.',
    });
  }

  if (!hasAnonKey) {
    missing.push({
      variable: 'VITE_SUPABASE_ANON_KEY',
      whereToGet: 'Supabase Dashboard -> Project Settings -> API -> anon public key (en frontend/.env o .env.local)',
      reason: 'Clave pública segura para consultas públicas en el navegador.',
    });
  }

  return {
    configured: hasUrl && hasAnonKey,
    hasUrl,
    hasAnonKey,
    missing,
  };
}

let browserClient: SupabaseClient | null = null;

/**
 * Retorna el cliente público de Supabase para el navegador si está configurado.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  const { configured } = inspectFrontendSupabaseEnv();
  if (!configured) return null;

  if (!browserClient) {
    browserClient = createClient(
      String(import.meta.env.VITE_SUPABASE_URL).trim(),
      String(import.meta.env.VITE_SUPABASE_ANON_KEY).trim(),
    );
  }
  return browserClient;
}

