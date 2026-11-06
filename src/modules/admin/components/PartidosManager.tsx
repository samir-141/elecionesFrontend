import React, { useState, useEffect } from 'react';
import { Partido } from '../../../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Flag, Plus, Eye, CheckCircle2, AlertCircle, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

interface Props {
  partidos: Partido[];
  eleccionEstado: string;
  onCrearPartido: (partido: { numero_lista: number; nombre: string; lema?: string; logo_url?: string }) => Promise<void>;
  onActualizar?: () => Promise<void>;
}

export function PartidosManager({ partidos, eleccionEstado, onCrearPartido, onActualizar }: Props) {
  const [numeroLista, setNumeroLista] = useState(partidos.length + 1);
  const [nombre, setNombre] = useState('');
  const [lema, setLema] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mostrarPreview, setMostrarPreview] = useState(false);

  // Sincronizar número sugerido de lista cuando cambian los partidos
  useEffect(() => {
    const siguienteNum = (partidos.length > 0 ? Math.max(...partidos.map((p) => p.numero_lista)) : 0) + 1;
    setNumeroLista(siguienteNum);
  }, [partidos]);

  // Estado para Edición de Partido
  const [partidoEditando, setPartidoEditando] = useState<Partido | null>(null);
  const [editNumeroLista, setEditNumeroLista] = useState(1);
  const [editNombre, setEditNombre] = useState('');
  const [editLema, setEditLema] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const isLocked = eleccionEstado !== 'BORRADOR';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    try {
      setSaving(true);
      setFeedback(null);
      setErrorMsg(null);
      await onCrearPartido({ numero_lista: numeroLista, nombre, lema });
      setNumeroLista((prev) => prev + 1);
      setNombre('');
      setLema('');
      setFeedback('Lista partidaria inscrita exitosamente.');
      onActualizar?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al inscribir partido.');
    } finally {
      setSaving(false);
    }
  };

  const handleAbrirEdicion = (partido: Partido) => {
    setPartidoEditando(partido);
    setEditNumeroLista(partido.numero_lista);
    setEditNombre(partido.nombre);
    setEditLema(partido.lema || '');
  };

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partidoEditando) return;
    try {
      setEditLoading(true);
      setErrorMsg(null);
      const res = await fetch(`${API_BASE}/admin/partidos/${partidoEditando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-actor-id': 'admin' },
        body: JSON.stringify({
          numero_lista: editNumeroLista,
          nombre: editNombre,
          lema: editLema || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error al actualizar lista');
      }

      setFeedback(`Lista "${editNombre}" actualizada exitosamente.`);
      setPartidoEditando(null);
      await onActualizar?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo actualizar la lista');
    } finally {
      setEditLoading(false);
    }
  };

  const handleEliminarPartido = async (partidoId: string, nombreP: string) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la lista "${nombreP}"?`)) {
      return;
    }
    try {
      setErrorMsg(null);
      const res = await fetch(`${API_BASE}/admin/partidos/${partidoId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-actor-id': 'admin' },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error al eliminar lista');
      }
      setFeedback(`Lista "${nombreP}" eliminada correctamente.`);
      await onActualizar?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo eliminar la lista');
    }
  };

  return (
    <div className="space-y-6">
      {/* Alertas */}
      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-semibold">{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-300 text-red-900 rounded-xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-700 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Formulario de Inscripción de Partido (Solo en BORRADOR) */}
      {!isLocked && (
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Flag className="w-5 h-5 text-blue-800" />
              <CardTitle className="text-base font-bold">Inscribir Lista Partidaria</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Registra los partidos estudiantiles postulantes. Se requieren al menos 2 listas para abrir la elección.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Número de Lista
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={numeroLista}
                  onChange={(e) => setNumeroLista(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 border rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-800 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Nombre de la Lista / Partido
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Innovación y Futuro Estudiantil"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Lema / Slogan
                </label>
                <input
                  type="text"
                  placeholder="Ej. Por un colegio más unido"
                  value={lema}
                  onChange={(e) => setLema(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-blue-800 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-4 flex justify-end pt-1">
                <Button type="submit" disabled={saving} size="sm" className="bg-blue-900 text-white font-bold text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  {saving ? 'Guardando...' : 'Inscribir Lista'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Partidos Inscritos y Botón de Previsualizar Cédula */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-black text-slate-900">
                Listas Electorales Inscritas ({partidos.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Candidaturas oficiales que figurarán en la cédula electrónica barajada
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMostrarPreview(!mostrarPreview)}
                className="text-xs font-bold text-slate-700"
              >
                <Eye className="w-4 h-4 mr-1 text-slate-600" />
                {mostrarPreview ? 'Ocultar Cédula' : 'Vista Previa Cédula'}
              </Button>
              {isLocked && <Badge className="bg-slate-800 text-white text-[10px]">Listas Congeladas</Badge>}
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
                  className="p-4 border-2 border-slate-200 hover:border-blue-300 rounded-xl bg-white shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-900 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-sm">
                      {partido.numero_lista}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-black uppercase text-blue-700 tracking-wider">
                        Lista #{partido.numero_lista}
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug truncate">{partido.nombre}</h4>
                      {partido.lema && <p className="text-xs text-slate-500 mt-1 italic">"{partido.lema}"</p>}
                    </div>
                  </div>

                  {/* Acciones de Edición (Solo si está en BORRADOR) */}
                  {!isLocked && (
                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAbrirEdicion(partido)}
                        className="h-7 text-xs font-bold text-blue-700 hover:text-blue-900 hover:bg-blue-50 px-2"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEliminarPartido(partido.id, partido.nombre)}
                        className="h-7 text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-50 px-2"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  )}
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

      {/* MODAL: EDITAR PARTIDO */}
      {partidoEditando && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-white shadow-2xl animate-in fade-in zoom-in-95 border-2 border-slate-200">
            <CardHeader className="bg-slate-900 text-white pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Edit2 className="w-5 h-5 text-blue-400" />
                  <CardTitle className="text-base font-black text-white">Editar Lista Partidaria</CardTitle>
                </div>
                <button
                  onClick={() => setPartidoEditando(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <CardDescription className="text-xs text-slate-300 mt-0.5">
                Modifica los datos de la lista electoral antes de aperturar la elección.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5">
              <form onSubmit={handleGuardarEdicion} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Número de Lista
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editNumeroLista}
                    onChange={(e) => setEditNumeroLista(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 border rounded-lg font-bold text-sm focus:ring-2 focus:ring-blue-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Nombre de la Lista / Partido
                  </label>
                  <input
                    type="text"
                    required
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-bold text-sm focus:ring-2 focus:ring-blue-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Lema o Slogan Institucional
                  </label>
                  <input
                    type="text"
                    value={editLema}
                    onChange={(e) => setEditLema(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-blue-800 focus:outline-hidden"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPartidoEditando(null)}
                    disabled={editLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={editLoading || !editNombre.trim()}
                    className="bg-blue-900 hover:bg-blue-950 text-white font-bold"
                  >
                    {editLoading ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
