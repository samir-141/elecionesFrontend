import { Shield, Clock, Terminal } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';

interface AuditItem {
  id: number;
  actor_tipo: string;
  actor_id: string;
  accion: string;
  entidad: string;
  entidad_id?: string;
  created_at: string;
  ip?: string;
}

interface Props {
  logs: AuditItem[];
}

export function AuditoriaTabla({ logs }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-blue-700" />
          <CardTitle className="text-lg">Registro Inmutable de Auditoría (Invariante I12)</CardTitle>
        </div>
        <CardDescription>
          Pistas de auditoría administrativa append-only. Ningún registro vincula electores con votos ni almacena el sentido del sufragio.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No se registran eventos de auditoría todavía.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Fecha / Hora</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Acción</th>
                  <th className="py-3 px-4">Entidad</th>
                  <th className="py-3 px-4">IP Origen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 flex items-center gap-1.5 whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(log.created_at).toLocaleTimeString('es-PE', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-[10px]">
                        {log.actor_tipo}: {log.actor_id}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-semibold text-blue-900">
                      <span className="flex items-center gap-1">
                        <Terminal className="w-3 h-3 text-slate-400" />
                        {log.accion}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{log.entidad}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{log.ip || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

