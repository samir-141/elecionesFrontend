import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  HardDrive,
  RefreshCw,
  ShieldAlert,
  Wrench,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import {
  DiagnosticStatus,
  mediaDiagnosticService,
  SupabaseDiagnosticReport,
} from '../../../services/images/media-diagnostic.service';

interface Props {
  report: SupabaseDiagnosticReport | null;
  loading: boolean;
  error: string | null;
  onRevalidar: () => Promise<void>;
  onReportUpdated: (report: SupabaseDiagnosticReport) => void;
}

export function SupabaseDiagnosticBanner({
  report,
  loading,
  error,
  onRevalidar,
  onReportUpdated,
}: Props) {
  const [inicializando, setInicializando] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [expandido, setExpandido] = useState(true);

  const badgeClass = (estado: DiagnosticStatus) => {
    if (estado === 'Correcto') {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
    if (estado === 'Advertencia') {
      return 'bg-amber-100 text-amber-800 border-amber-300';
    }
    return 'bg-rose-100 text-rose-800 border-rose-300';
  };

  const handleInicializarBuckets = async () => {
    try {
      setInicializando(true);
      setInitError(null);
      const res = await mediaDiagnosticService.inicializarBuckets();
      onReportUpdated(res.diagnostico);
    } catch (err: any) {
      setInitError(err.message || 'No se pudieron inicializar los buckets.');
    } finally {
      setInicializando(false);
    }
  };

  const puedeCrearBuckets =
    report &&
    report.envStatus.hasUrl &&
    report.envStatus.hasServiceRoleKey &&
    report.bucketsEsperados.some((b) => !b.existe);

  return (
    <Card
      className={`border-2 shadow-sm ${
        error || (report && !report.listoParaOperar)
          ? 'border-amber-300 bg-amber-50/30'
          : 'border-emerald-200 bg-emerald-50/20'
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                error || (report && !report.listoParaOperar)
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {report?.listoParaOperar ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <HardDrive className="w-5 h-5" />
              )}
            </div>
            <div>
              <CardTitle className="text-base font-black text-slate-900">
                Diagnóstico de Conexión — Supabase Storage
              </CardTitle>
              <CardDescription className="text-xs text-slate-600">
                {loading
                  ? 'Validando credenciales, buckets, permisos y base de datos...'
                  : report?.listoParaOperar
                  ? 'Sistema de almacenamiento centralizado operativo y verificado.'
                  : 'Se requiere revisar la configuración de Supabase Storage antes de cargar archivos.'}
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {puedeCrearBuckets && (
              <Button
                size="sm"
                onClick={handleInicializarBuckets}
                disabled={inicializando || loading}
                className="bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold"
              >
                <Wrench className="w-3.5 h-3.5 mr-1.5" />
                {inicializando ? 'Creando Buckets...' : 'Crear Buckets en Supabase'}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onRevalidar}
              disabled={loading}
              className="text-xs font-bold bg-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Re-validar Conexión
            </Button>

            <button
              type="button"
              onClick={() => setExpandido((v) => !v)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900"
              title={expandido ? 'Contraer diagnóstico' : 'Expandir diagnóstico'}
            >
              {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </CardHeader>

      {expandido && (
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Error al ejecutar diagnóstico</div>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {initError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{initError}</span>
            </div>
          )}

          {report && (
            <>
              {/* Tabla estructurada de Diagnóstico */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="py-2.5 px-4 font-bold">Componente</th>
                      <th className="py-2.5 px-4 font-bold">Estado</th>
                      <th className="py-2.5 px-4 font-bold">Detalle y Solución</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.componentes.map((comp) => (
                      <tr key={comp.componente} className="align-top">
                        <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                          {comp.componente}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeClass(
                              comp.estado,
                            )}`}
                          >
                            {comp.estado}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 space-y-1">
                          <div>{comp.detalle}</div>
                          {comp.solucion && (
                            <div className="text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700">
                              <strong className="text-slate-900">Solución:</strong> {comp.solucion}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Variables faltantes en servidor o cliente */}
              {(report.envStatus.missingVariables.length > 0 ||
                !report.frontendEnvStatus.configured) && (
                <div className="p-4 rounded-xl bg-white border border-amber-300 space-y-3 text-xs">
                  <div className="flex items-center gap-2 font-black text-amber-900">
                    <Database className="w-4 h-4 text-amber-700" />
                    <span>Variables de Entorno Pendientes de Configurar</span>
                  </div>
                  <p className="text-slate-600">
                    Por seguridad jamás generamos ni inventamos claves ficticias. Copia tus credenciales reales desde{' '}
                    <strong>Supabase Dashboard → Project Settings → API</strong> y agrégalas en{' '}
                    <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">backend/.env</code> (o{' '}
                    <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">backend/.env.local</code>) y{' '}
                    <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">frontend/.env</code>:
                  </p>

                  <div className="space-y-2">
                    {report.envStatus.missingVariables.map((item) => (
                      <div
                        key={item.variable}
                        className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200"
                      >
                        <div className="font-mono font-bold text-slate-900">{item.variable}</div>
                        <div className="text-slate-700 mt-0.5">{item.reason}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Dónde obtenerla: <span className="font-medium text-slate-700">{item.whereToGet}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}

