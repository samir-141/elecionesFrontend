import React, { useState } from 'react';
import { Eleccion, ReglasEleccion } from '../../../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Lock, Save, Sliders, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  eleccion: Eleccion;
  onSaveReglas: (reglas: Partial<ReglasEleccion>) => Promise<void>;
}

export function ReglasConfiguracion({ eleccion, onSaveReglas }: Props) {
  const [formData, setFormData] = useState<ReglasEleccion>(eleccion.reglas);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isLocked = eleccion.estado !== 'BORRADOR';

  const handleChange = (field: keyof ReglasEleccion, value: any) => {
    if (isLocked) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    try {
      setSaving(true);
      setFeedback(null);
      await onSaveReglas(formData);
      setFeedback({ type: 'success', message: 'Reglas actualizadas y registradas en auditoría exitosamente.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error al guardar las reglas.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de Estado de Reglas */}
      {isLocked ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-lg flex items-center space-x-3 text-sm">
          <Lock className="w-5 h-5 text-amber-700 flex-shrink-0" />
          <div>
            <strong>Reglas Electorales Congeladas:</strong> La elección se encuentra en estado{' '}
            <Badge variant="default">{eleccion.estado}</Badge>. Por seguridad democrática e invariantes del sistema, las reglas son de solo lectura.
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-lg flex items-center space-x-3 text-sm">
          <Sliders className="w-5 h-5 text-blue-700 flex-shrink-0" />
          <div>
            <strong>Modo Borrador:</strong> Puedes ajustar las reglas de la elección. Al presionar "Abrir Elección", todas las reglas se congelarán y se calculará la huella digital SHA-256.
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={`p-4 rounded-lg flex items-center space-x-2 text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-red-50 border border-red-200 text-red-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tarjeta 1: Voto en Blanco y Cómputo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cómputo de Votos y Umbrales</CardTitle>
              <CardDescription>Criterios de validez de sufragio institucional</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isLocked}
                    checked={formData.blanco_en_porcentaje}
                    onChange={(e) => handleChange('blanco_en_porcentaje', e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-800 focus:ring-blue-700 disabled:opacity-50"
                  />
                  <div>
                    <span className="font-semibold text-sm text-slate-900">
                      Incluir Voto en Blanco en porcentaje válido
                    </span>
                    <p className="text-xs text-slate-500">
                      Si se activa, los votos en blanco forman parte del divisor para calcular los porcentajes de los partidos.
                    </p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">
                  Porcentaje mínimo para ganar en 1ra vuelta (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  disabled={isLocked}
                  value={formData.porcentaje_minimo_ganar}
                  onChange={(e) => handleChange('porcentaje_minimo_ganar', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 disabled:bg-slate-100 disabled:text-slate-500"
                />
                <p className="text-xs text-slate-500 mt-1">Por defecto: 50% de los votos válidos.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">
                  Quórum mínimo institucional (% del padrón)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  disabled={isLocked}
                  value={formData.quorum_porcentaje}
                  onChange={(e) => handleChange('quorum_porcentaje', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">
                  Acción ante falta de quórum
                </label>
                <select
                  disabled={isLocked}
                  value={formData.accion_sin_quorum}
                  onChange={(e) => handleChange('accion_sin_quorum', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="DECLARAR_DESIERTA">Declarar Desierta la Elección</option>
                  <option value="PRORROGAR">Prorrogar plazo de votación</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Tarjeta 2: Segunda Vuelta y Desempate */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Desempate y Operación de Puestos</CardTitle>
              <CardDescription>Parámetros técnicos de contingencia y tiempos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isLocked}
                    checked={formData.segunda_vuelta}
                    onChange={(e) => handleChange('segunda_vuelta', e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-800 focus:ring-blue-700 disabled:opacity-50"
                  />
                  <div>
                    <span className="font-semibold text-sm text-slate-900">
                      Habilitar Segunda Vuelta (Balotaje)
                    </span>
                    <p className="text-xs text-slate-500">
                      Si ninguna lista supera el umbral, se declara pase a segunda vuelta.
                    </p>
                  </div>
                </label>
              </div>

              {formData.segunda_vuelta && (
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1">
                    Listas que avanzan a segunda vuelta
                  </label>
                  <select
                    disabled={isLocked}
                    value={formData.cuantos_pasan_segunda_vuelta}
                    onChange={(e) => handleChange('cuantos_pasan_segunda_vuelta', parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option value={2}>2 Listas con mayor votación</option>
                    <option value={3}>3 Listas con mayor votación</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">
                  Regla de Desempate en resultados
                </label>
                <select
                  disabled={isLocked}
                  value={formData.regla_empate}
                  onChange={(e) => handleChange('regla_empate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="SORTEO">Sorteo Público Aleatorio</option>
                  <option value="ANTIGUEDAD">Antigüedad / Grado Escolar</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">
                  Tiempo de reserva de puesto (segundos)
                </label>
                <input
                  type="number"
                  min="60"
                  max="600"
                  step="30"
                  disabled={isLocked}
                  value={formData.duracion_reserva_segundos}
                  onChange={(e) => handleChange('duracion_reserva_segundos', parseInt(e.target.value, 10) || 180)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 disabled:bg-slate-100 disabled:text-slate-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {Math.round(formData.duracion_reserva_segundos / 60)} minuto(s). Si el estudiante no vota en este lapso, el puesto se libera.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">
                  Restricción por IP pública (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. 190.234.12.0/24 (dejar vacío si no aplica)"
                  disabled={isLocked}
                  value={formData.ip_restringida || ''}
                  onChange={(e) => handleChange('ip_restringida', e.target.value ? e.target.value : null)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {!isLocked && (
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving} size="touch" className="bg-blue-900 hover:bg-blue-800 text-white">
              <Save className="w-5 h-5 mr-2" />
              {saving ? 'Guardando en Base de Datos...' : 'Guardar Configuración de Reglas'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}

