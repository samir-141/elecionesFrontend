import React, { useState, useEffect } from 'react';
import { Candidato, Partido, MediaCategoria } from '../../../types';
import { getApiBaseUrl } from '../../../config/api';
import { eleccionApiService } from '../services/eleccion.service';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { ImageUploadModal } from '../../../components/admin/image-manager/ImageUploadModal';
import {
  Flag,
  Plus,
  Eye,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  UploadCloud,
  UserPlus,
  Users,
  Image as ImageIcon,
} from 'lucide-react';

interface Props {
  partidos: Partido[];
  eleccionId?: string;
  eleccionEstado: string;
  onCrearPartido: (partido: {
    numero_lista: number;
    nombre: string;
    lema?: string;
    logo_url?: string | null;
    logo_media_id?: string | null;
  }) => Promise<void>;
  onActualizar?: () => Promise<void>;
}

export function PartidosManager({
  partidos,
  eleccionId,
  eleccionEstado,
  onCrearPartido,
  onActualizar,
}: Props) {
  const [numeroLista, setNumeroLista] = useState(partidos.length + 1);
  const [nombre, setNombre] = useState('');
  const [lema, setLema] = useState('');
  const [nuevoLogoUrl, setNuevoLogoUrl] = useState<string | null>(null);
  const [nuevoLogoMediaId, setNuevoLogoMediaId] = useState<string | null>(null);
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
  const [editLogoUrl, setEditLogoUrl] = useState<string | null>(null);
  const [editLogoMediaId, setEditLogoMediaId] = useState<string | null | undefined>(undefined);
  const [editLoading, setEditLoading] = useState(false);

  // Modal de Candidato (Crear / Editar)
  const [candidatoModalPartido, setCandidatoModalPartido] = useState<Partido | null>(null);
  const [candidatoEditando, setCandidatoEditando] = useState<Candidato | null>(null);
  const [candNombres, setCandNombres] = useState('');
  const [candApellidos, setCandApellidos] = useState('');
  const [candCargo, setCandCargo] = useState('Alcalde Escolar');
  const [candFotoUrl, setCandFotoUrl] = useState<string | null>(null);
  const [candFotoMediaId, setCandFotoMediaId] = useState<string | null | undefined>(undefined);
  const [candSaving, setCandSaving] = useState(false);

  // Modal unificado de subida de imagen en Supabase Storage
  const [uploadCtx, setUploadCtx] = useState<{
    open: boolean;
    target: 'nuevo_partido' | 'editar_partido' | 'direct_partido' | 'candidato_modal';
    categoria: MediaCategoria;
    entidadTipo?: string;
    entidadId?: string;
    titulo: string;
  } | null>(null);

  const isLocked = eleccionEstado !== 'BORRADOR';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    try {
      setSaving(true);
      setFeedback(null);
      setErrorMsg(null);
      await onCrearPartido({
        numero_lista: numeroLista,
        nombre,
        lema,
        ...(nuevoLogoUrl ? { logo_url: nuevoLogoUrl } : {}),
        ...(nuevoLogoMediaId ? { logo_media_id: nuevoLogoMediaId } : {}),
      });
      setNumeroLista((prev) => prev + 1);
      setNombre('');
      setLema('');
      setNuevoLogoUrl(null);
      setNuevoLogoMediaId(null);
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
    setEditLogoUrl(partido.logo_url || null);
    setEditLogoMediaId(partido.logo_media_id);
  };

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partidoEditando) return;
    try {
      setEditLoading(true);
      setErrorMsg(null);
      const res = await fetch(`${getApiBaseUrl()}/admin/partidos/${partidoEditando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-actor-id': 'admin' },
        body: JSON.stringify({
          numero_lista: editNumeroLista,
          nombre: editNombre,
          lema: editLema || undefined,
          ...(editLogoMediaId !== undefined ? { logo_media_id: editLogoMediaId } : {}),
          ...(editLogoUrl !== undefined ? { logo_url: editLogoUrl } : {}),
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
      const res = await fetch(`${getApiBaseUrl()}/admin/partidos/${partidoId}`, {
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

  const abrirModalCandidato = (partido: Partido, candidato?: Candidato) => {
    setCandidatoModalPartido(partido);
    if (candidato) {
      setCandidatoEditando(candidato);
      setCandNombres(candidato.nombres);
      setCandApellidos(candidato.apellidos);
      setCandCargo(candidato.cargo);
      setCandFotoUrl(candidato.foto_url);
      setCandFotoMediaId(candidato.foto_media_id);
    } else {
      setCandidatoEditando(null);
      setCandNombres('');
      setCandApellidos('');
      setCandCargo('Alcalde Escolar');
      setCandFotoUrl(null);
      setCandFotoMediaId(undefined);
    }
  };

  const handleGuardarCandidato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidatoModalPartido) return;
    try {
      setCandSaving(true);
      setErrorMsg(null);
      if (candidatoEditando) {
        await eleccionApiService.actualizarCandidato(candidatoEditando.id, {
          nombres: candNombres.trim(),
          apellidos: candApellidos.trim(),
          cargo: candCargo.trim(),
          ...(candFotoMediaId !== undefined ? { foto_media_id: candFotoMediaId } : {}),
          ...(candFotoUrl !== undefined ? { foto_url: candFotoUrl } : {}),
        });
        setFeedback(`Candidato ${candNombres} ${candApellidos} actualizado.`);
      } else {
        await eleccionApiService.agregarCandidato(candidatoModalPartido.id, {
          nombres: candNombres.trim(),
          apellidos: candApellidos.trim(),
          cargo: candCargo.trim(),
          ...(candFotoMediaId ? { foto_media_id: candFotoMediaId } : {}),
          ...(candFotoUrl ? { foto_url: candFotoUrl } : {}),
        });
        setFeedback(`Candidato ${candNombres} ${candApellidos} agregado a ${candidatoModalPartido.nombre}.`);
      }
      setCandidatoModalPartido(null);
      await onActualizar?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo guardar el candidato.');
    } finally {
      setCandSaving(false);
    }
  };

  const handleEliminarCandidato = async (candidato: Candidato) => {
    if (!window.confirm(`¿Eliminar al candidato ${candidato.nombres} ${candidato.apellidos}?`)) return;
    try {
      setErrorMsg(null);
      await eleccionApiService.eliminarCandidato(candidato.id);
      setFeedback(`Candidato ${candidato.nombres} ${candidato.apellidos} eliminado.`);
      await onActualizar?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al eliminar candidato.');
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
              Registra los partidos estudiantiles postulantes con su logotipo en Supabase Storage. Se requieren al menos 2 listas para abrir la elección.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Nº Lista
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

              <div className="sm:col-span-2">
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

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Logotipo
                </label>
                <div className="flex items-center gap-2">
                  {nuevoLogoUrl && (
                    <img
                      src={nuevoLogoUrl}
                      alt="Logo"
                      className="w-9 h-9 rounded-lg border object-contain bg-white p-0.5 shrink-0"
                    />
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setUploadCtx({
                        open: true,
                        target: 'nuevo_partido',
                        categoria: 'listas',
                        titulo: 'Subir Logotipo de Lista Electoral',
                      })
                    }
                    className="w-full text-xs font-bold"
                  >
                    <UploadCloud className="w-3.5 h-3.5 mr-1" />
                    {nuevoLogoUrl ? 'Cambiar' : 'Subir'}
                  </Button>
                </div>
              </div>

              <div className="sm:col-span-6 flex justify-end pt-1">
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
                Candidaturas oficiales, logotipos y postulantes que figurarán en el proceso electoral
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
                  <div>
                    <div className="flex items-start space-x-3">
                      {partido.logo_url ? (
                        <div className="w-12 h-12 rounded-xl border border-slate-200 bg-white overflow-hidden shrink-0 flex items-center justify-center p-1 shadow-xs">
                          <img
                            src={partido.logo_url}
                            alt={partido.nombre}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-blue-900 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-sm">
                          {partido.numero_lista}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-black uppercase text-blue-700 tracking-wider">
                          Lista #{partido.numero_lista}
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm leading-snug truncate">{partido.nombre}</h4>
                        {partido.lema && <p className="text-xs text-slate-500 mt-1 italic">"{partido.lema}"</p>}
                      </div>
                    </div>

                    {/* Candidatos de la lista */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase text-slate-500 flex items-center gap-1">
                          <Users className="w-3 h-3" /> Candidatos ({partido.candidatos?.length || 0})
                        </span>
                        {!isLocked && (
                          <button
                            type="button"
                            onClick={() => abrirModalCandidato(partido)}
                            className="text-[11px] font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-0.5"
                          >
                            <UserPlus className="w-3 h-3" /> Añadir
                          </button>
                        )}
                      </div>

                      {partido.candidatos && partido.candidatos.length > 0 ? (
                        <div className="space-y-1.5">
                          {partido.candidatos.map((c) => (
                            <div
                              key={c.id}
                              className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {c.foto_url ? (
                                  <img
                                    src={c.foto_url}
                                    alt={c.nombres}
                                    className="w-7 h-7 rounded-full object-cover border border-slate-300 shrink-0"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                                    {c.nombres[0]}
                                    {c.apellidos[0]}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-800 truncate text-[11px]">
                                    {c.nombres} {c.apellidos}
                                  </div>
                                  <div className="text-[10px] text-slate-500 truncate">{c.cargo}</div>
                                </div>
                              </div>
                              {!isLocked && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => abrirModalCandidato(partido, c)}
                                    className="p-1 text-slate-500 hover:text-blue-700"
                                    title="Editar candidato"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleEliminarCandidato(c)}
                                    className="p-1 text-slate-500 hover:text-rose-600"
                                    title="Eliminar candidato"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400">Sin candidatos asignados aún.</p>
                      )}
                    </div>
                  </div>

                  {/* Acciones de Edición (Solo si está en BORRADOR) */}
                  {!isLocked && (
                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setUploadCtx({
                            open: true,
                            target: 'direct_partido',
                            categoria: 'listas',
                            entidadTipo: 'partido',
                            entidadId: partido.id,
                            titulo: `Subir Logotipo — ${partido.nombre}`,
                          })
                        }
                        className="h-7 text-[11px] font-bold text-indigo-700 hover:bg-indigo-50 px-2"
                      >
                        <ImageIcon className="w-3.5 h-3.5 mr-1" />
                        Logo
                      </Button>

                      <div className="flex items-center space-x-1">
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
                    {p.logo_url ? (
                      <div className="w-12 h-12 rounded-xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center p-1 mb-2">
                        <img src={p.logo_url} alt={p.nombre} className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-black text-xl flex items-center justify-center mb-2">
                        {p.numero_lista}
                      </div>
                    )}
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
                Modifica los datos y logotipo oficial antes de aperturar la elección.
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

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
                    Logotipo del Partido
                  </label>
                  <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                    {editLogoUrl ? (
                      <img
                        src={editLogoUrl}
                        alt="Logo actual"
                        className="w-12 h-12 rounded-lg border object-contain bg-white p-1"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setUploadCtx({
                            open: true,
                            target: 'editar_partido',
                            categoria: 'listas',
                            titulo: `Subir Logotipo — ${editNombre}`,
                          })
                        }
                        className="text-xs font-bold"
                      >
                        <UploadCloud className="w-3.5 h-3.5 mr-1" />
                        Subir Nuevo
                      </Button>
                      {editLogoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditLogoUrl(null);
                            setEditLogoMediaId(null);
                          }}
                          className="text-xs text-rose-600"
                        >
                          Quitar Logo
                        </Button>
                      )}
                    </div>
                  </div>
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

      {/* MODAL: CREAR / EDITAR CANDIDATO */}
      {candidatoModalPartido && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-white shadow-2xl border-2 border-slate-200 animate-in fade-in zoom-in-95">
            <CardHeader className="bg-blue-950 text-white pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-black text-white">
                  {candidatoEditando ? 'Editar Candidato' : `Nuevo Candidato — ${candidatoModalPartido.nombre}`}
                </CardTitle>
                <button
                  type="button"
                  onClick={() => setCandidatoModalPartido(null)}
                  className="text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <CardDescription className="text-xs text-blue-200">
                Registra los datos y fotografía oficial en Supabase Storage
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5">
              <form onSubmit={handleGuardarCandidato} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Nombres *</label>
                  <input
                    type="text"
                    required
                    value={candNombres}
                    onChange={(e) => setCandNombres(e.target.value)}
                    placeholder="Ej. Valeria Sofía"
                    className="w-full px-3 py-2 border rounded-lg font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={candApellidos}
                    onChange={(e) => setCandApellidos(e.target.value)}
                    placeholder="Ej. Torres Quispe"
                    className="w-full px-3 py-2 border rounded-lg font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Cargo *</label>
                  <input
                    type="text"
                    required
                    value={candCargo}
                    onChange={(e) => setCandCargo(e.target.value)}
                    placeholder="Ej. Alcalde Escolar / Regidor de Deportes"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Fotografía Oficial del Candidato
                  </label>
                  <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                    {candFotoUrl ? (
                      <img
                        src={candFotoUrl}
                        alt="Foto candidato"
                        className="w-12 h-12 rounded-full object-cover border border-slate-300"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                        <Users className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setUploadCtx({
                            open: true,
                            target: 'candidato_modal',
                            categoria: 'candidatos',
                            titulo: 'Subir Fotografía de Candidato',
                          })
                        }
                        className="text-xs font-bold"
                      >
                        <UploadCloud className="w-3.5 h-3.5 mr-1" />
                        Subir Foto
                      </Button>
                      {candFotoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCandFotoUrl(null);
                            setCandFotoMediaId(null);
                          }}
                          className="text-xs text-rose-600"
                        >
                          Quitar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCandidatoModalPartido(null)}
                    disabled={candSaving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={candSaving}
                    className="bg-blue-900 hover:bg-blue-950 text-white font-bold"
                  >
                    {candSaving ? 'Guardando...' : 'Guardar Candidato'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal reutilizable de subida de imagen */}
      {uploadCtx && (
        <ImageUploadModal
          isOpen={uploadCtx.open}
          defaultCategoria={uploadCtx.categoria}
          lockCategoria={true}
          eleccionId={eleccionId}
          entidadTipo={uploadCtx.entidadTipo}
          entidadId={uploadCtx.entidadId}
          tituloModal={uploadCtx.titulo}
          onClose={() => setUploadCtx(null)}
          onSuccess={(media) => {
            const url = media.url_publica || media.url_visualizacion;
            if (uploadCtx.target === 'nuevo_partido') {
              setNuevoLogoUrl(url);
              setNuevoLogoMediaId(media.id);
            } else if (uploadCtx.target === 'editar_partido') {
              setEditLogoUrl(url);
              setEditLogoMediaId(media.id);
            } else if (uploadCtx.target === 'candidato_modal') {
              setCandFotoUrl(url);
              setCandFotoMediaId(media.id);
            } else if (uploadCtx.target === 'direct_partido') {
              setFeedback('Logotipo vinculado al partido correctamente.');
              onActualizar?.();
            }
          }}
        />
      )}
    </div>
  );
}
