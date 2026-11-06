import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { UserCheck, ShieldAlert, CheckSquare, Square, RefreshCw, X, Monitor, Unlock } from 'lucide-react';
import { ElectorConsultado } from '../services/habilitacion.service';

interface ElectorFichaModalProps {
  isOpen: boolean;
  elector: ElectorConsultado | null;
  puestosDisponibles?: Array<{ id: string; numero_puesto: number; estado: string }>;
  onClose: () => void;
  onConfirm: (electorId: string, puestoId?: string) => void;
  isLoading: boolean;
  errorMessage: string | null;
}

export function ElectorFichaModal({
  isOpen,
  elector,
  puestosDisponibles = [],
  onClose,
  onConfirm,
  isLoading,
  errorMessage,
}: ElectorFichaModalProps) {
  const [verificadoFisico, setVerificadoFisico] = useState(false);
  const [puestoSeleccionado, setPuestoSeleccionado] = useState<string>('');

  const puestosLibres = puestosDisponibles.filter((p) => p.estado === 'LIBRE');

  useEffect(() => {
    setVerificadoFisico(false);
    if (puestosLibres.length > 0) {
      setPuestoSeleccionado(puestosLibres[0].id);
    } else {
      setPuestoSeleccionado('');
    }
  }, [elector?.elector_id, isOpen]);

  if (!isOpen || !elector) return null;

  const sinPuestos = puestosLibres.length === 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <Card className="max-w-md w-full bg-white shadow-2xl border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        <CardHeader className="bg-emerald-800 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-inner">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base font-black text-white">Verificación de Identidad</CardTitle>
                <CardDescription className="text-xs text-emerald-200">
                  Control de Elector • Padrón Institucional
                </CardDescription>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-emerald-300 hover:text-white p-1 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Error:</span> {errorMessage}
              </div>
            </div>
          )}

          {/* Ficha de Datos del Estudiante */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">DNI</span>
              <span className="text-sm font-mono font-black text-slate-900 bg-white px-2.5 py-0.5 rounded border border-slate-300">
                {elector.dni}
              </span>
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold block">
                Nombres y Apellidos
              </span>
              <span className="text-base font-extrabold text-slate-900">
                {elector.apellidos}, {elector.nombres}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Grado y Sección</span>
                <span className="text-xs font-bold text-slate-800">{elector.grado_seccion}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Mesa / Aula</span>
                <span className="text-xs font-bold text-emerald-800">{elector.aula_nombre}</span>
              </div>
            </div>
          </div>

          {/* Selección o Indicación de la Mesa de Votación a Habilitar */}
          <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-blue-950">
              <span className="flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-blue-700" /> Mesa de Votación Destino:
              </span>
              <span className="text-[10px] font-mono uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                {sinPuestos ? '0 Libres' : `${puestosLibres.length} Libre(s)`}
              </span>
            </div>

            {sinPuestos ? (
              <p className="text-xs text-amber-800 font-semibold leading-tight pt-1">
                ⚠️ Todas las máquinas de este salón están ocupadas o no hay máquinas vinculadas. Espere a que se libere un puesto.
              </p>
            ) : puestosLibres.length === 1 ? (
              <div className="text-xs font-bold text-slate-800 bg-white p-2 rounded-lg border border-blue-200 flex items-center justify-between">
                <span>Puesto #{puestosLibres[0].numero_puesto}</span>
                <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Listo para desbloquear
                </span>
              </div>
            ) : (
              <div>
                <select
                  value={puestoSeleccionado}
                  onChange={(e) => setPuestoSeleccionado(e.target.value)}
                  className="w-full text-xs font-bold bg-white border border-blue-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                >
                  {puestosLibres.map((p) => (
                    <option key={p.id} value={p.id}>
                      Puesto #{p.numero_puesto} (Disponible)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Checkbox Obligatorio de Verificación Física */}
          <div
            onClick={() => !isLoading && !sinPuestos && setVerificadoFisico(!verificadoFisico)}
            className={`p-3 rounded-xl border-2 transition-all flex items-start space-x-3 ${
              sinPuestos
                ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200'
                : verificadoFisico
                ? 'bg-emerald-50/70 border-emerald-600 text-emerald-950 cursor-pointer shadow-xs'
                : 'bg-white border-slate-300 hover:border-slate-400 text-slate-700 cursor-pointer'
            }`}
          >
            <div className="shrink-0 mt-0.5 text-emerald-700">
              {verificadoFisico ? (
                <CheckSquare className="w-5 h-5 text-emerald-600" />
              ) : (
                <Square className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className="text-xs leading-relaxed">
              <span className="font-bold text-slate-900">Comprobación física de identidad conforme:</span>
              <p className="text-[11px] text-slate-600 mt-0.5">
                He comprobado presencialmente que el DNI y el estudiante corresponden a este registro oficial.
              </p>
            </div>
          </div>

          {/* Botón de Confirmación y Desbloqueo de Mesa */}
          <div className="space-y-2 pt-1">
            <Button
              type="button"
              disabled={!verificadoFisico || isLoading || sinPuestos}
              onClick={() => onConfirm(elector.elector_id, puestoSeleccionado || undefined)}
              size="touch"
              className={`w-full font-black text-sm shadow-md transition-all ${
                verificadoFisico && !sinPuestos
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white animate-pulse'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Desbloqueando Mesa de Votación...
                </>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <Unlock className="w-4 h-4 text-emerald-200" />
                  Habilitar Mesa y Desbloquear Votación
                </span>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={onClose}
              className="w-full text-xs text-slate-600"
            >
              Cancelar y volver
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
