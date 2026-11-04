import React, { useState } from 'react';
import { Partido } from '../../../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Flag, Plus, Eye, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  partidos: Partido[];
  eleccionEstado: string;
  onCrearPartido: (partido: { numero_lista: number; nombre: string; lema?: string; logo_url?: string }) => Promise<void>;
}

export function PartidosManager({ partidos, eleccionEstado, onCrearPartido }: Props) {
  const [numeroLista, setNumeroLista] = useState(partidos.length + 1);
  const [nombre, setNombre] = useState('');
  const [lema, setLema] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [mostrarPreview, setMostrarPreview] = useState(false);

  const isLocked = eleccionEstado !== 'BORRADOR';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    try {
      setSaving(true);
      setFeedback(null);
      await onCrearPartido({ numero_lista: numeroLista, nombre, lema });
      setNumeroLista((prev) => prev + 1);
      setNombre('');
      setLema('');
      setFeedback('Lista partidaria inscrita exitosamente.');
    } catch (err: any) {
      setFeedback(err.message || 'Error al inscribir partido.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulario de Inscripción de Partido */}
      {!isLocked && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Flag className="w-5 h-5 text-blue-800" />
              <CardTitle className="text-lg">Inscribir Lista Partidaria</CardTitle>
            </div>
            <CardDescription>
              Registra los partidos estudiantiles postulantes. Se requieren al menos 2 listas para abrir la elección.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {feedback && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>{feedback}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Número de Lista</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={numeroLista}
                  onChange={(e) => setNumeroLista(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-800 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre de la Lista / Partido</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Innovación y Futuro Estudiantil"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lema o Slogan (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. Por un colegio más limpio y unido"
                  value={lema}
                  onChange={(e) => setLema(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-800 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-4 flex justify-end pt-2">
                <Button type="submit" disabled={saving} size="sm" className="bg-blue-900 text-white">
                  <Plus className="w-4 h-4 mr-1" />
                  {saving ? 'Guardando...' : 'Inscribir Lista'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Partidos Inscritos y Botón de Previsualizar Cédula */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Listas Electorales Inscritas ({partidos.length})</CardTitle>
              <CardDescription>Candidaturas oficiales que figurarán en la cédula electrónica</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMostrarPreview(!mostrarPreview)}
                className="text-xs"
              >
                <Eye className="w-4 h-4 mr-1 text-slate-600" />
                {mostrarPreview ? 'Ocultar Cédula' : 'Vista Previa de Cédula'}
              </Button>
              {isLocked && <Badge variant="default">Listas Congeladas</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {partidos.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No hay listas inscritas. Se requieren al menos 2 listas para abrir la elección.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partidos.map((partido) => (
                <div
                  key={partido.id}
                  className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start space-x-3"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-900 text-white font-extrabold text-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    {partido.numero_lista}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-tight">{partido.nombre}</h4>
                    {partido.lema && <p className="text-xs text-slate-500 mt-1 italic">"{partido.lema}"</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cédula de Votación (Invariante I18: Neutralidad visual y Voto en Blanco idéntico) */}
          {mostrarPreview && (
            <div className="pt-6 border-t border-slate-200">
              <div className="mb-4 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Simulación de Cédula Digital (Invariante I18)
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  El orden de aparición se aleatoriza por cada votante. La opción en blanco tiene dimensiones idénticas.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto p-4 bg-slate-100 rounded-2xl border">
                {partidos.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white border-2 border-slate-300 rounded-xl p-5 flex flex-col justify-between items-center text-center shadow-sm min-h-[140px]"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-black text-xl flex items-center justify-center mb-2">
                      {p.numero_lista}
                    </div>
                    <div className="font-bold text-slate-900 text-sm">{p.nombre}</div>
                    <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">{p.lema}</div>
                  </div>
                ))}

                {/* VOTO EN BLANCO: Invariante I18 */}
                <div className="bg-white border-2 border-slate-300 rounded-xl p-5 flex flex-col justify-between items-center text-center shadow-sm min-h-[140px]">
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-400 bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center mb-2">
                    BLANCO
                  </div>
                  <div className="font-bold text-slate-900 text-sm">VOTO EN BLANCO</div>
                  <div className="text-[11px] text-slate-500 mt-1">Opción neutral automática</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

