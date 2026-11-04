import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { UserCheck, ShieldAlert, CheckSquare, Square, RefreshCw, X } from 'lucide-react';
import { ElectorConsultado } from '../services/habilitacion.service';

interface ElectorFichaModalProps {
  isOpen: boolean;
  elector: ElectorConsultado | null;
  onClose: () => void;
  onConfirm: (electorId: string) => void;
  isLoading: boolean;
  errorMessage: string | null;
}

export function ElectorFichaModal({
  isOpen,
  elector,
  onClose,
  onConfirm,
  isLoading,
  errorMessage,
}: ElectorFichaModalProps) {
  const [verificadoFisico, setVerificadoFisico] = useState(false);

  if (!isOpen || !elector) return null;

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
                <CardTitle className="text-base font-black text-white">Verificación de Elector</CardTitle>
                <CardDescription className="text-xs text-emerald-200">
                  Comprobación en Padrón Oficial
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
                <span className="text-[10px] text-slate-500 block">Grado y Sección</span>
                <span className="text-xs font-bold text-slate-800">{elector.grado_seccion}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Aula Asignada</span>
                <span className="text-xs font-bold text-emerald-800">{elector.aula_nombre}</span>
              </div>
            </div>
          </div>

          {/* Checkbox Obligatorio de Verificación Física */}
          <div
            onClick={() => !isLoading && setVerificadoFisico(!verificadoFisico)}
            className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-start space-x-3 ${
              verificadoFisico
                ? 'bg-emerald-50/70 border-emerald-600 text-emerald-950'
                : 'bg-white border-slate-300 hover:border-slate-400 text-slate-700'
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
              <span className="font-bold">Comprobación física conforme:</span>
              <p className="text-[11px] text-slate-600 mt-0.5">
                He comprobado presencialmente que la tarjeta de identidad y el estudiante corresponden a este registro.
              </p>
            </div>
          </div>

          {/* Botón de Confirmación y Reserva Atómica */}
          <div className="space-y-2 pt-1">
            <Button
              type="button"
              disabled={!verificadoFisico || isLoading}
              onClick={() => onConfirm(elector.elector_id)}
              size="touch"
              className={`w-full font-bold text-base shadow-sm ${
                verificadoFisico
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Reservando Puesto Libre...
                </>
              ) : (
                'Confirmar y Asignar Puesto'
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={onClose}
              className="w-full text-xs text-slate-600"
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

