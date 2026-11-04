import React, { useState } from 'react';
import { Aula } from '../../../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { School, Plus, Monitor, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  aulas: Aula[];
  eleccionEstado: string;
  onCrearAula: (aula: { numero: number; nombre: string; capacidad: number }) => Promise<void>;
  onAbrirPuerta: (aulaId: string) => void;
}

export function AulasManager({ aulas, eleccionEstado, onCrearAula, onAbrirPuerta }: Props) {
  const [numero, setNumero] = useState(aulas.length + 1);
  const [nombre, setNombre] = useState(`Aula ${aulas.length + 1}`);
  const [capacidad, setCapacidad] = useState(50);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isLocked = eleccionEstado !== 'BORRADOR';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    try {
      setSaving(true);
      setFeedback(null);
      await onCrearAula({ numero, nombre, capacidad });
      setNumero((prev) => prev + 1);
      setNombre(`Aula ${numero + 1}`);
      setFeedback('Aula registrada correctamente.');
    } catch (err: any) {
      setFeedback(err.message || 'Error al crear aula.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulario de Alta de Aula */}
      {!isLocked && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <School className="w-5 h-5 text-blue-800" />
              <CardTitle className="text-lg">Registrar Nueva Aula de Votación</CardTitle>
            </div>
            <CardDescription>
              Define los salones físicos donde se ubicarán los docentes y puestos de votación.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {feedback && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-700 flex-shrink-0" />
                <span>{feedback}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Número de Aula</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={numero}
                  onChange={(e) => setNumero(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-800 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre / Identificador</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Aula 1 (Pabellón A - 1er piso)"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Aforo Máximo</label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={capacidad}
                  onChange={(e) => setCapacidad(parseInt(e.target.value, 10) || 50)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-800 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-4 flex justify-end pt-2">
                <Button type="submit" disabled={saving} size="sm" className="bg-blue-900 text-white">
                  <Plus className="w-4 h-4 mr-1" />
                  {saving ? 'Guardando...' : 'Agregar Aula'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Listado de Aulas Configuradas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Aulas Configuradas ({aulas.length})</CardTitle>
              <CardDescription>Salones oficiales habilitados para el sufragio</CardDescription>
            </div>
            {isLocked && <Badge variant="default">Aulas Congeladas</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          {aulas.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No hay aulas registradas. Se requiere al menos 1 aula para abrir la elección.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {aulas.map((aula) => (
                <div
                  key={aula.id}
                  className="p-4 border border-slate-200 rounded-xl bg-slate-50 hover:bg-white hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-900 rounded">
                        Aula #{aula.numero}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Aforo: {aula.capacidad} electores</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-base">{aula.nombre}</h4>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-200 flex justify-between items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAbrirPuerta(aula.id)}
                      className="w-full text-xs flex items-center justify-center gap-1.5 bg-white hover:bg-blue-50 hover:text-blue-900 hover:border-blue-300"
                    >
                      <Monitor className="w-3.5 h-3.5 text-blue-700" />
                      Abrir Pantalla de Puerta
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

